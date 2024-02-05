import { packDataBytes } from '@taquito/michel-codec';
import { Schema } from '@taquito/michelson-encoder';
import type { TezosToolkit } from '@taquito/taquito';
import type Web3 from 'web3';

import {
  BridgeTokenTransferKind, BridgeTokenTransferStatus,
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
import { EventEmitter, ToEventEmitter, type PublicEventEmitter, type TokenBridgeService } from './common';
import { EtherlinkBlockchainBridgeComponent, type NonNativeEtherlinkToken } from './etherlink';
import {
  TezosBlockchainBridgeComponent, tezosTicketerContentMichelsonType,
  type TezosToken, type NativeTezosToken, type NonNativeTezosToken
} from './tezos';
import type { TokenBridgeOptions } from './tokenBridgeOptions';
import { guards } from './utils';

interface TokenBridgeComponents {
  readonly tezos: TezosBlockchainBridgeComponent;
  readonly etherlink: EtherlinkBlockchainBridgeComponent;
}

interface TokenBridgeComponentsEvents {
  readonly accountTokenTransferCreated: PublicEventEmitter<readonly [accountAddress: string, tokenTransfer: BridgeTokenTransfer]>;
  readonly accountTokenTransferUpdated: PublicEventEmitter<readonly [accountAddress: string, tokenTransfer: BridgeTokenTransfer]>;
  readonly tokenTransferCreated: PublicEventEmitter<readonly [tokenTransfer: BridgeTokenTransfer]>;
  readonly tokenTransferUpdated: PublicEventEmitter<readonly [tokenTransfer: BridgeTokenTransfer]>;
}

export class TokenBridge implements TokenBridgeService {
  readonly bridgeComponents: TokenBridgeComponents;
  readonly events: TokenBridgeComponentsEvents = {
    accountTokenTransferCreated: new EventEmitter(),
    accountTokenTransferUpdated: new EventEmitter(),
    tokenTransferCreated: new EventEmitter(),
    tokenTransferUpdated: new EventEmitter()
  };

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

  subscribeToAccount(accountAddress: string): void {
    this.transfersBridgeDataProvider.subscribeToTokenTransfers(accountAddress);
  }

  unsubscribeFromAccount(accountAddress: string): void {
    this.transfersBridgeDataProvider.unsubscribeFromTokenTransfers(accountAddress);
  }

  subscribeToAccounts(accountAddresses: readonly string[]): void {
    this.transfersBridgeDataProvider.subscribeToTokenTransfers(accountAddresses);
  }

  unsubscribeFromAccounts(accountAddresses: readonly string[]): void {
    this.transfersBridgeDataProvider.unsubscribeFromTokenTransfers(accountAddresses);
  }

  subscribeToTokenTransfer(transfer: BridgeTokenTransfer): void;
  subscribeToTokenTransfer(operationHash: BridgeTokenTransfer): void;
  subscribeToTokenTransfer(transferOrOperationHash: BridgeTokenTransfer | string): void {
    const operationHash = typeof transferOrOperationHash === 'string'
      ? transferOrOperationHash
      : this.getInitialOperationHash(transferOrOperationHash);
    this.transfersBridgeDataProvider.subscribeToTokenTransfer(operationHash);
  }

  subscribeFromTokenTransfer(transfer: BridgeTokenTransfer): void;
  subscribeFromTokenTransfer(operationHash: BridgeTokenTransfer): void;
  subscribeFromTokenTransfer(transferOrOperationHash: BridgeTokenTransfer | string): void {
    const operationHash = typeof transferOrOperationHash === 'string'
      ? transferOrOperationHash
      : this.getInitialOperationHash(transferOrOperationHash);
    this.transfersBridgeDataProvider.unsubscribeFromTokenTransfer(operationHash);
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

      setTimeout(() => {
        this.transfersBridgeDataProvider.subscribeToTokenTransfer(operationHash);
        statusWatchers.set(status, {
          promise: watcherPromise,
          resolve: (updatedTransfer: BridgeTokenTransfer) => {
            this.transfersBridgeDataProvider.unsubscribeFromTokenTransfer(operationHash);
            resolve(updatedTransfer);
          },
          reject: (error: unknown) => {
            this.transfersBridgeDataProvider.unsubscribeFromTokenTransfer(operationHash);
            reject(error);
          }
        });
      }, 0);
    });

    return watcherPromise;
  }

  async deposit(token: TezosToken, amount: bigint): Promise<WalletDepositResult>;
  async deposit(token: TezosToken, amount: bigint, etherlinkReceiverAddress: string): Promise<WalletDepositResult>;
  async deposit(token: TezosToken, amount: bigint, options: WalletDepositOptions): Promise<WalletDepositResult>;
  async deposit(token: TezosToken, amount: bigint, options: DepositOptions): Promise<DepositResult>;
  async deposit(token: TezosToken, amount: bigint, etherlinkReceiverAddress: string, options: WalletDepositOptions): Promise<WalletDepositResult>;
  async deposit(token: TezosToken, amount: bigint, etherlinkReceiverAddress: string, options: DepositOptions): Promise<DepositResult>;
  async deposit(
    token: TezosToken,
    amount: bigint,
    etherlinkReceiverAddressOrOptions?: string | WalletDepositOptions | DepositOptions,
    options?: WalletDepositOptions | DepositOptions
  ): Promise<WalletDepositResult | DepositResult> {
    const etherlinkReceiverAddress = typeof etherlinkReceiverAddressOrOptions === 'string'
      ? etherlinkReceiverAddressOrOptions
      : await this.getEtherlinkConnectedAddress();
    const depositOptions = typeof etherlinkReceiverAddressOrOptions !== 'string' && etherlinkReceiverAddressOrOptions ? etherlinkReceiverAddressOrOptions : options;
    const useWalletApi = depositOptions && depositOptions.useWalletApi !== undefined ? depositOptions.useWalletApi : true;

    const tokenPair = await this.tokensBridgeDataProvider.getRegisteredTokenPair(token);
    if (!tokenPair)
      throw new Error(`Token (${token.type}${token.type === 'fa1.2' ? ', ' + token.address : ''}${token.type === 'fa2' ? ', ' + token.tokenId : ''}) is not listed`);

    const ticketHelperContractAddress = token.type === 'native'
      ? tokenPair.tezos.ticketerContractAddress
      : (tokenPair.tezos as Exclude<typeof tokenPair.tezos, { type: 'native' }>).tickerHelperContractAddress;
    const etherlinkTokenProxyContractAddress = token.type === 'native'
      ? undefined
      : (tokenPair.etherlink as Exclude<typeof tokenPair.etherlink, { type: 'native' }>).address;

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

    (this.events.tokenTransferCreated as ToEventEmitter<typeof this.events.tokenTransferCreated>).emit(depositOperation.tokenTransfer);

    return depositOperation;
  }

  async startWithdraw(token: NonNativeEtherlinkToken, amount: bigint, tezosReceiverAddress?: string): Promise<StartWithdrawResult> {
    if ((token.type as string) === 'native')
      throw new Error('Withdrawal of native tokens is not supported yet');

    if (!tezosReceiverAddress) {
      tezosReceiverAddress = await this.getTezosConnectedAddress();
    }

    const tokenPair = await this.tokensBridgeDataProvider.getRegisteredTokenPair(token);
    if (!tokenPair)
      throw new Error(`Token (${token.address}) is not listed`);

    const tezosTicketerAddress = tokenPair.tezos.ticketerContractAddress;
    const etherlinkTokenProxyContractAddress = (tokenPair.etherlink as Exclude<typeof tokenPair.etherlink, { type: 'native' }>).address;
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
    const bridgeTokenWithdrawal: StartWithdrawResult['tokenTransfer'] = {
      kind: BridgeTokenTransferKind.Withdrawal,
      status: BridgeTokenTransferStatus.Pending,
      etherlinkOperation: {
        hash: withdrawalTransactionReceipt.transactionHash.toString(),
        timestamp: Date.now().toString(),
        amount,
        source: withdrawalTransactionReceipt.from,
        receiver: tezosReceiverAddress,
        receiverProxy: tezosProxyAddress,
        token,
      }
    };

    (this.events.tokenTransferCreated as ToEventEmitter<typeof this.events.tokenTransferCreated>).emit(bridgeTokenWithdrawal);

    return {
      tokenTransfer: bridgeTokenWithdrawal,
      startWithdrawOperation: withdrawalTransactionReceipt
    };
  }

  async finishWithdraw(bridgeTokenPartialWithdrawal: SealedBridgeTokenWithdrawal): Promise<FinishWithdrawResult> {
    const _finishWithdrawOperation = await this.bridgeComponents.tezos.finishWithdraw(
      bridgeTokenPartialWithdrawal.rollupData.commitment,
      bridgeTokenPartialWithdrawal.rollupData.proof
    );

    return {
      tokenTransfer: bridgeTokenPartialWithdrawal,
      // finishWithdrawOperation
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

  protected resolveStatusWatcherIfNeeded(tokenTransfer: BridgeTokenTransfer) {
    const initialOperationHash = this.getInitialOperationHash(tokenTransfer);
    const statusWatchers = this.tokenTransferOperationWatchers.get(initialOperationHash);
    if (!statusWatchers)
      return;

    for (const [status, watcher] of statusWatchers) {
      if (tokenTransfer.status >= status) {
        watcher.resolve(tokenTransfer);
        statusWatchers.delete(status);
      }
    }

    if (!statusWatchers.size)
      this.tokenTransferOperationWatchers.delete(initialOperationHash);
  }

  protected getInitialOperationHash(tokenTransfer: BridgeTokenTransfer): string {
    return tokenTransfer.kind === BridgeTokenTransferKind.Deposit
      ? tokenTransfer.tezosOperation.hash
      : tokenTransfer.etherlinkOperation.hash;
  }

  protected attachEvents() {
    this.transfersBridgeDataProvider.events.accountTokenTransferCreated.addListener(this.handleTransfersBridgeDataProviderAccountTokenTransferCreated);
    this.transfersBridgeDataProvider.events.accountTokenTransferUpdated.addListener(this.handleTransfersBridgeDataProviderAccountTokenTransferUpdated);
    this.transfersBridgeDataProvider.events.tokenTransferCreated.addListener(this.handleTransfersBridgeDataProviderTokenTransferCreated);
    this.transfersBridgeDataProvider.events.tokenTransferUpdated.addListener(this.handleTransfersBridgeDataProviderTokenTransferUpdated);
  }

  protected detachEvents() {
    this.transfersBridgeDataProvider.events.tokenTransferUpdated.removeListener(this.handleTransfersBridgeDataProviderTokenTransferUpdated);
    this.transfersBridgeDataProvider.events.tokenTransferCreated.removeListener(this.handleTransfersBridgeDataProviderTokenTransferCreated);
    this.transfersBridgeDataProvider.events.accountTokenTransferUpdated.removeListener(this.handleTransfersBridgeDataProviderAccountTokenTransferUpdated);
    this.transfersBridgeDataProvider.events.accountTokenTransferCreated.removeListener(this.handleTransfersBridgeDataProviderAccountTokenTransferCreated);
  }

  protected handleTransfersBridgeDataProviderAccountTokenTransferCreated = (accountAddress: string, createdTokenTransfer: BridgeTokenTransfer) => {
    (this.events.accountTokenTransferCreated as ToEventEmitter<typeof this.events.accountTokenTransferCreated>).emit(accountAddress, createdTokenTransfer);
  };

  protected handleTransfersBridgeDataProviderAccountTokenTransferUpdated = (accountAddress: string, createdTokenTransfer: BridgeTokenTransfer) => {
    this.resolveStatusWatcherIfNeeded(createdTokenTransfer);

    (this.events.accountTokenTransferUpdated as ToEventEmitter<typeof this.events.accountTokenTransferUpdated>).emit(accountAddress, createdTokenTransfer);
  };

  protected handleTransfersBridgeDataProviderTokenTransferCreated = (createdTokenTransfer: BridgeTokenTransfer) => {
    (this.events.tokenTransferCreated as ToEventEmitter<typeof this.events.tokenTransferCreated>).emit(createdTokenTransfer);
  };

  protected handleTransfersBridgeDataProviderTokenTransferUpdated = (updatedTokenTransfer: BridgeTokenTransfer) => {
    this.resolveStatusWatcherIfNeeded(updatedTokenTransfer);

    (this.events.tokenTransferUpdated as ToEventEmitter<typeof this.events.tokenTransferUpdated>).emit(updatedTokenTransfer);
  };

  private async depositUsingWalletApi(
    token: TezosToken,
    amount: bigint,
    etherlinkReceiverAddress: string,
    options: WalletDepositOptions | undefined | null,
    ticketHelperOrNativeTokenTicketerContractAddress: string,
    etherlinkTokenProxyContractAddress?: string
  ): Promise<WalletDepositResult> {
    const isNativeToken = token.type === 'native';
    if (!isNativeToken && !etherlinkTokenProxyContractAddress) {
      throw new Error('Etherlink Token Proxy contract not specified');
    }

    const [depositOperation, sourceAddress] = await Promise.all([
      isNativeToken
        ? this.bridgeComponents.tezos.wallet.depositNativeToken({
          amount,
          etherlinkReceiverAddress,
          ticketerContractAddress: ticketHelperOrNativeTokenTicketerContractAddress,
        })
        : this.bridgeComponents.tezos.wallet.depositNonNativeToken({
          token,
          amount,
          etherlinkReceiverAddress,
          ticketHelperContractAddress: ticketHelperOrNativeTokenTicketerContractAddress,
          etherlinkTokenProxyContractAddress: etherlinkTokenProxyContractAddress!
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
          receiverProxy: etherlinkTokenProxyContractAddress || null,
          token,
        }
      },
      depositOperation
    };
  }

  private async depositUsingContractApi(
    token: TezosToken,
    amount: bigint,
    etherlinkReceiverAddress: string,
    options: DepositOptions | undefined | null,
    ticketHelperOrNativeTokenTicketerContractAddress: string,
    etherlinkTokenProxyContractAddress?: string
  ): Promise<DepositResult> {
    const isNativeToken = token.type === 'native';
    if (!isNativeToken && !etherlinkTokenProxyContractAddress) {
      throw new Error('Etherlink Token Proxy contract not specified');
    }

    const depositOperation = await (isNativeToken
      ? this.bridgeComponents.tezos.depositNativeToken({
        amount,
        etherlinkReceiverAddress,
        ticketerContractAddress: ticketHelperOrNativeTokenTicketerContractAddress
      })
      : this.bridgeComponents.tezos.depositNonNativeToken({
        token,
        amount,
        etherlinkReceiverAddress,
        ticketHelperContractAddress: ticketHelperOrNativeTokenTicketerContractAddress,
        etherlinkTokenProxyContractAddress: etherlinkTokenProxyContractAddress!
      })
    );

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
          receiverProxy: etherlinkTokenProxyContractAddress || null,
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
