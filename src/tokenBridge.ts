import { packDataBytes } from '@taquito/michel-codec';
import { Schema } from '@taquito/michelson-encoder';
import type { TezosToolkit } from '@taquito/taquito';
import type Web3 from 'web3';

import {
  BridgeTokenTransferKind, BridgeTokenTransferStatus,
  type TokenPair,
  type DepositOptions, type WalletDepositOptions, type DepositResult, type WalletDepositResult,
  type StartWithdrawResult, type FinishWithdrawResult,

  type BridgeTokenTransfer,
  type PendingBridgeTokenDeposit, type CreatedBridgeTokenDeposit, type FinishedBridgeTokenDeposit,
  type PendingBridgeTokenWithdrawal, type CreatedBridgeTokenWithdrawal, type SealedBridgeTokenWithdrawal, type FinishedBridgeTokenWithdrawal,
} from './bridge';
import type {
  TokensBridgeDataProvider, LocalTokensBridgeDataProvider,
  BalancesBridgeDataProvider,
  TransfersBridgeDataProvider
} from './bridgeDataProviders';
import type { TokenBridgeService } from './common';
import {
  EtherlinkBlockchainBridgeComponent,
  type NonNativeEtherlinkToken
} from './etherlink';
import {
  TezosBlockchainBridgeComponent, tezosTicketerContentMichelsonType,
  type NonNativeTezosToken,
  FA2TezosToken
} from './tezos';
import type { TokenBridgeOptions } from './tokenBridgeOptions';
import { guards } from './utils';

interface TokenBridgeComponents {
  readonly tezos: TezosBlockchainBridgeComponent;
  readonly etherlink: EtherlinkBlockchainBridgeComponent;
}

export class TokenBridge implements TokenBridgeService {
  readonly bridgeComponents: TokenBridgeComponents;
  readonly balancesBridgeDataProvider: BalancesBridgeDataProvider;
  readonly tokensBridgeDataProvider: TokensBridgeDataProvider | LocalTokensBridgeDataProvider;
  readonly transfersBridgeDataProvider: TransfersBridgeDataProvider;

  protected readonly tezosToolkit: TezosToolkit;
  protected readonly etherlinkToolkit: Web3;

  protected readonly tezosTicketerContentSchema = new Schema(tezosTicketerContentMichelsonType);
  protected readonly tokenTransferOperationWatchers = new Map<
    string,
    Map<BridgeTokenTransferStatus, {
      readonly promise: Promise<BridgeTokenTransfer>,
      readonly resolve: (transfer: BridgeTokenTransfer) => void,
      readonly reject: (error: unknown) => void
    }>
  >();

  private _isStarted = false;

  constructor(options: TokenBridgeOptions) {
    this.tezosToolkit = options.tezos.toolkit;
    this.etherlinkToolkit = options.etherlink.toolkit;

    this.tokensBridgeDataProvider = options.bridgeDataProviders.tokens;
    this.balancesBridgeDataProvider = options.bridgeDataProviders.balances;
    this.transfersBridgeDataProvider = options.bridgeDataProviders.transfers;

    const tezosBlockchainBridgeComponent = new TezosBlockchainBridgeComponent({
      tezosToolkit: this.tezosToolkit,
      rollupAddress: options.tezos.bridgeOptions.rollupAddress
    });
    const etherlinkBlockchainBridgeComponent = new EtherlinkBlockchainBridgeComponent({
      etherlinkToolkit: this.etherlinkToolkit,
      kernelAddress: options.etherlink.bridgeOptions.kernelAddress,
      withdrawPrecompileAddress: options.etherlink.bridgeOptions.withdrawPrecompileAddress
    });
    this.bridgeComponents = {
      tezos: tezosBlockchainBridgeComponent,
      etherlink: etherlinkBlockchainBridgeComponent
    };
  }

  get isStarted() {
    return this._isStarted;
  }

  async start(): Promise<void> {
    if (this.isStarted)
      return;

    this.attachEvents();

    const dataProviderPromises: Array<Promise<void>> = [];
    if (guards.isTokenBridgeService(this.tokensBridgeDataProvider))
      dataProviderPromises.push(this.tokensBridgeDataProvider.start());

    if (guards.isTokenBridgeService(this.balancesBridgeDataProvider))
      dataProviderPromises.push(this.balancesBridgeDataProvider.start());

    if (guards.isTokenBridgeService(this.transfersBridgeDataProvider))
      dataProviderPromises.push(this.transfersBridgeDataProvider.start());

    await Promise.all(dataProviderPromises);

    this._isStarted = true;
  }

  stop(): void {
    if (!this.isStarted)
      return;

    if (guards.isTokenBridgeService(this.tokensBridgeDataProvider))
      this.tokensBridgeDataProvider.stop();

    if (guards.isTokenBridgeService(this.balancesBridgeDataProvider))
      this.balancesBridgeDataProvider.stop();

    if (guards.isTokenBridgeService(this.transfersBridgeDataProvider))
      this.transfersBridgeDataProvider.stop();

    this._isStarted = false;
  }

  async waitBridgeTokenTransferStatus(transfer: PendingBridgeTokenDeposit, status: BridgeTokenTransferStatus.Created): Promise<CreatedBridgeTokenDeposit>;
  async waitBridgeTokenTransferStatus(transfer: PendingBridgeTokenDeposit | CreatedBridgeTokenDeposit, status: BridgeTokenTransferStatus.Finished): Promise<FinishedBridgeTokenDeposit>;
  async waitBridgeTokenTransferStatus(transfer: PendingBridgeTokenWithdrawal, status: BridgeTokenTransferStatus.Created): Promise<CreatedBridgeTokenWithdrawal>;
  async waitBridgeTokenTransferStatus(transfer: PendingBridgeTokenWithdrawal | CreatedBridgeTokenWithdrawal, status: BridgeTokenTransferStatus.Sealed): Promise<SealedBridgeTokenWithdrawal>;
  async waitBridgeTokenTransferStatus(
    transfer: PendingBridgeTokenWithdrawal | CreatedBridgeTokenWithdrawal | SealedBridgeTokenWithdrawal,
    status: BridgeTokenTransferStatus.Finished
  ): Promise<FinishedBridgeTokenWithdrawal>;
  async waitBridgeTokenTransferStatus(transfer: BridgeTokenTransfer, status: BridgeTokenTransferStatus): Promise<BridgeTokenTransfer>;
  async waitBridgeTokenTransferStatus(transfer: BridgeTokenTransfer, status: BridgeTokenTransferStatus): Promise<BridgeTokenTransfer> {
    if (transfer.status >= status)
      return transfer;

    const operationHash = this.getInitialOperationHash(transfer);
    const updatedTransfer = await this.transfersBridgeDataProvider.getTokenTransfer(operationHash);
    if (updatedTransfer?.status === status)
      return updatedTransfer;

    let statusWatchers = this.tokenTransferOperationWatchers.get(operationHash);
    if (!statusWatchers) {
      statusWatchers = new Map();
      this.tokenTransferOperationWatchers.set(operationHash, statusWatchers);
    }

    const watcher = statusWatchers.get(status);
    if (watcher)
      return watcher.promise;

    const watcherPromise = new Promise<BridgeTokenTransfer>((resolve, reject) => {
      const statusWatchers = this.tokenTransferOperationWatchers.get(operationHash);
      if (!statusWatchers) {
        reject(`Status watchers map not found for the ${operationHash} operation`);
        return;
      }

      statusWatchers.set(status, {
        promise: watcherPromise,
        resolve,
        reject
      });
    });

    return watcherPromise;
  }

  async deposit(token: NonNativeTezosToken, amount: bigint): Promise<WalletDepositResult>;
  async deposit(token: NonNativeTezosToken, amount: bigint, etherlinkReceiverAddress: string): Promise<WalletDepositResult>;
  async deposit(token: NonNativeTezosToken, amount: bigint, options: WalletDepositOptions): Promise<WalletDepositResult>;
  async deposit(token: NonNativeTezosToken, amount: bigint, options: DepositOptions): Promise<DepositResult>;
  async deposit(token: NonNativeTezosToken, amount: bigint, etherlinkReceiverAddress: string, options: WalletDepositOptions): Promise<WalletDepositResult>;
  async deposit(token: NonNativeTezosToken, amount: bigint, etherlinkReceiverAddress: string, options: DepositOptions): Promise<DepositResult>;
  async deposit(
    token: NonNativeTezosToken,
    amount: bigint,
    etherlinkReceiverAddressOrOptions?: string | WalletDepositOptions | DepositOptions,
    options?: WalletDepositOptions | DepositOptions
  ): Promise<WalletDepositResult | DepositResult> {
    const etherlinkReceiverAddress = typeof etherlinkReceiverAddressOrOptions === 'string'
      ? etherlinkReceiverAddressOrOptions
      : await this.getEtherlinkConnectedAddress();
    const depositOptions = typeof etherlinkReceiverAddressOrOptions !== 'string' && etherlinkReceiverAddressOrOptions ? etherlinkReceiverAddressOrOptions : options;
    const useWalletApi = depositOptions && depositOptions.useWalletApi !== undefined ? depositOptions.useWalletApi : true;

    const tokenPair = await this.getRegisteredTokenPair(token);
    if (!tokenPair)
      throw new Error(`Token (${token.address}) is not listed`);

    const ticketHelperContractAddress = tokenPair.tezos.tickerHelperContractAddress;
    const etherlinkTokenProxyContractAddress = tokenPair.etherlink.address;

    const depositOperation = await (useWalletApi
      ? this.depositUsingWalletApi(
        token,
        amount,
        etherlinkReceiverAddress,
        depositOptions as WalletDepositOptions,
        ticketHelperContractAddress,
        etherlinkTokenProxyContractAddress
      )
      : this.depositUsingContractApi(
        token,
        amount,
        etherlinkReceiverAddress,
        depositOptions as DepositOptions,
        ticketHelperContractAddress,
        etherlinkTokenProxyContractAddress
      )
    );

    return depositOperation;
  }

  async startWithdraw(token: NonNativeEtherlinkToken, amount: bigint, tezosReceiverAddress?: string): Promise<StartWithdrawResult> {
    if (!tezosReceiverAddress) {
      tezosReceiverAddress = await this.getTezosConnectedAddress();
    }

    const tokenPair = await this.getRegisteredTokenPair(token);
    if (!tokenPair)
      throw new Error(`Token (${token.address}) is not listed`);

    const tezosTicketerAddress = tokenPair.tezos.ticketerContractAddress;
    const etherlinkTokenProxyContractAddress = tokenPair.etherlink.address;
    const tezosProxyAddress = tezosTicketerAddress;

    const [etherlinkConnectedAddress, tezosTicketerContent] = await Promise.all([
      this.getEtherlinkConnectedAddress(),
      this.getTezosTicketerContent(tezosTicketerAddress)
    ]);

    const withdrawalTransactionReceipt = await this.bridgeComponents.etherlink.withdraw({
      tezosReceiverAddress,
      amount,
      tezosTicketerContent,
      etherlinkSenderAddress: etherlinkConnectedAddress,
      etherlinkTokenProxyContractAddress,
      tezosProxyAddress,
      tezosTicketerAddress
    });

    return {
      tokenTransfer: {
        kind: BridgeTokenTransferKind.Withdrawal,
        status: BridgeTokenTransferStatus.Pending,
        etherlinkOperation: {
          hash: withdrawalTransactionReceipt.transactionHash.toString(),
          timestamp: Date.now().toString(),
          amount,
          source: withdrawalTransactionReceipt.from,
          receiver: tezosReceiverAddress,
          token,
        }
      },
      withdrawOperation: withdrawalTransactionReceipt
    };
  }

  async finishWithdraw(bridgeTokenPartialWithdrawal: SealedBridgeTokenWithdrawal): Promise<FinishWithdrawResult> {
    const finishWithdrawOperationHash = await this.bridgeComponents.tezos.finishWithdraw(
      bridgeTokenPartialWithdrawal.rollupData.commitment,
      bridgeTokenPartialWithdrawal.rollupData.proof
    );

    return {
      tokenTransfer: bridgeTokenPartialWithdrawal
    };
  }

  async getTezosConnectedAddress(): Promise<string> {
    return this.tezosToolkit.wallet.pkh();
  }

  async getEtherlinkConnectedAddress(): Promise<string> {
    const accounts = await this.etherlinkToolkit.eth.getAccounts();
    const address = accounts[0] || this.etherlinkToolkit.eth.defaultAccount;
    if (!address)
      throw new Error('Address is unavailable');

    return address;
  }

  protected getRegisteredTokenPair(token: NonNativeTezosToken | NonNativeEtherlinkToken): TokenPair | undefined | null | Promise<TokenPair | null> {
    return guards.isReadonlyArray(this.tokensBridgeDataProvider)
      ? this.tokensBridgeDataProvider.find(tokenPair => {
        return (tokenPair.tezos.type === token.type && tokenPair.tezos.address === token.address && (tokenPair.tezos as FA2TezosToken).tokenId === (token as FA2TezosToken).tokenId)
          || (tokenPair.etherlink.type === token.type && tokenPair.etherlink.address === token.address);
      })
      : this.tokensBridgeDataProvider.getRegisteredTokenPair(token);
  }

  protected attachEvents() {
    this.transfersBridgeDataProvider.events.tokenTransferUpdated.addListener(this.handleTransfersBridgeDataProviderTokenTransferUpdated);
  }

  protected detachEvents() {
    this.transfersBridgeDataProvider.events.tokenTransferUpdated.removeListener(this.handleTransfersBridgeDataProviderTokenTransferUpdated);
  }

  protected handleTransfersBridgeDataProviderTokenTransferUpdated = (updatedTokenTransfer: BridgeTokenTransfer) => {
    const initialOperationHash = this.getInitialOperationHash(updatedTokenTransfer);
    const statusWatchers = this.tokenTransferOperationWatchers.get(initialOperationHash);
    if (!statusWatchers)
      return;

    for (const [status, watcher] of statusWatchers) {
      if (updatedTokenTransfer.status >= status) {
        watcher.resolve(updatedTokenTransfer);
        statusWatchers.delete(status);
      }
    }

    if (!statusWatchers.size)
      this.tokenTransferOperationWatchers.delete(initialOperationHash);
  };

  private getInitialOperationHash(tokenTransfer: BridgeTokenTransfer): string {
    return tokenTransfer.kind === BridgeTokenTransferKind.Deposit
      ? tokenTransfer.tezosOperation.hash
      : tokenTransfer.etherlinkOperation.hash;
  }

  private async depositUsingWalletApi(
    token: NonNativeTezosToken,
    amount: bigint,
    etherlinkReceiverAddress: string,
    options: WalletDepositOptions | undefined | null,
    ticketHelperContractAddress: string,
    etherlinkTokenProxyContractAddress: string
  ): Promise<WalletDepositResult> {
    const [depositOperation, sourceAddress] = await Promise.all([
      this.bridgeComponents.tezos.wallet.deposit({
        token,
        amount,
        etherlinkReceiverAddress,
        ticketHelperContractAddress,
        etherlinkTokenProxyContractAddress
      }),
      this.getTezosConnectedAddress()
    ]);

    return {
      tokenTransfer: {
        kind: BridgeTokenTransferKind.Deposit,
        status: BridgeTokenTransferStatus.Pending,
        tezosOperation: {
          hash: depositOperation.opHash,
          timestamp: new Date().toISOString(),
          amount,
          source: sourceAddress,
          receiver: etherlinkReceiverAddress,
          token,
        }
      },
      depositOperation
    };
  }

  private async depositUsingContractApi(
    token: NonNativeTezosToken,
    amount: bigint,
    etherlinkReceiverAddress: string,
    options: DepositOptions | undefined | null,
    ticketHelperContractAddress: string,
    etherlinkTokenProxyContractAddress: string
  ): Promise<DepositResult> {
    const depositOperation = await this.bridgeComponents.tezos.deposit({
      token,
      amount,
      etherlinkReceiverAddress,
      ticketHelperContractAddress,
      etherlinkTokenProxyContractAddress
    });

    return {
      tokenTransfer: {
        kind: BridgeTokenTransferKind.Deposit,
        status: BridgeTokenTransferStatus.Pending,
        tezosOperation: {
          hash: depositOperation.hash,
          timestamp: new Date().toISOString(),
          amount,
          source: depositOperation.source,
          receiver: etherlinkReceiverAddress,
          token,
        }
      },
      depositOperation
    };
  }

  private async getTezosTicketerContent(tezosTicketerAddress: string): Promise<string> {
    const contract = await this.tezosToolkit.contract.at(tezosTicketerAddress);
    const storage = await contract.storage<{ content: unknown }>();
    const contentMichelsonData = this.tezosTicketerContentSchema.Encode(storage.content);

    return '0x' + packDataBytes(contentMichelsonData, tezosTicketerContentMichelsonType).bytes.slice(2);
  }
}
