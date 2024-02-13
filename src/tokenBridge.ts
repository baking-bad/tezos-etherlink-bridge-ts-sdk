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
  type PendingBridgeTokenWithdrawal, type CreatedBridgeTokenWithdrawal, type SealedBridgeTokenWithdrawal, type FinishedBridgeTokenWithdrawal
} from './bridge';
import type {
  TokensBridgeDataProvider,
  BalancesBridgeDataProvider,
  TransfersBridgeDataProvider,
  AccountTokenBalanceInfo
} from './bridgeDataProviders';
import { EventEmitter, ToEventEmitter, type PublicEventEmitter, type TokenBridgeService } from './common';
import { EtherlinkBlockchainBridgeComponent, EtherlinkToken, type NonNativeEtherlinkToken } from './etherlink';
import { TezosBlockchainBridgeComponent, tezosTicketerContentMichelsonType, type TezosToken } from './tezos';
import { TokenBridgeDataFacade } from './tokenBridgeDataFacade';
import type { TokenBridgeOptions } from './tokenBridgeOptions';
import { bridgeUtils, etherlinkUtils, guards } from './utils';

interface TokenBridgeComponents {
  readonly tezos: TezosBlockchainBridgeComponent;
  readonly etherlink: EtherlinkBlockchainBridgeComponent;
  readonly balancesBridgeDataProvider: BalancesBridgeDataProvider;
  readonly tokensBridgeDataProvider: TokensBridgeDataProvider;
  readonly transfersBridgeDataProvider: TransfersBridgeDataProvider;
}

interface TokenBridgeComponentsEvents {
  readonly tokenTransferCreated: PublicEventEmitter<readonly [tokenTransfer: BridgeTokenTransfer]>;
  readonly tokenTransferUpdated: PublicEventEmitter<readonly [tokenTransfer: BridgeTokenTransfer]>;
}

export class TokenBridge implements TokenBridgeService {
  readonly data: TokenBridgeDataFacade;
  readonly bridgeComponents: TokenBridgeComponents;
  readonly events: TokenBridgeComponentsEvents = {
    tokenTransferCreated: new EventEmitter(),
    tokenTransferUpdated: new EventEmitter()
  };

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
      etherlink: etherlinkBlockchainBridgeComponent,
      tokensBridgeDataProvider: options.bridgeDataProviders.tokens,
      balancesBridgeDataProvider: options.bridgeDataProviders.balances,
      transfersBridgeDataProvider: options.bridgeDataProviders.transfers
    };
    this.data = {
      getBalance: this.getBalance.bind(this),
      getBalances: this.getBalances.bind(this),
      getRegisteredTokenPair: this.getRegisteredTokenPair.bind(this),
      getRegisteredTokenPairs: this.getRegisteredTokenPairs.bind(this),
      getTokenTransfer: this.getTokenTransfer.bind(this),
      getTokenTransfers: this.getTokenTransfers.bind(this),
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
    if (guards.isTokenBridgeService(this.bridgeComponents.tokensBridgeDataProvider))
      dataProviderPromises.push(this.bridgeComponents.tokensBridgeDataProvider.start());

    if (guards.isTokenBridgeService(this.bridgeComponents.balancesBridgeDataProvider))
      dataProviderPromises.push(this.bridgeComponents.balancesBridgeDataProvider.start());

    if (guards.isTokenBridgeService(this.bridgeComponents.transfersBridgeDataProvider))
      dataProviderPromises.push(this.bridgeComponents.transfersBridgeDataProvider.start());

    await Promise.all(dataProviderPromises);

    this._isStarted = true;
  }

  stop(): void {
    if (!this.isStarted)
      return;

    if (guards.isTokenBridgeService(this.bridgeComponents.tokensBridgeDataProvider))
      this.bridgeComponents.tokensBridgeDataProvider.stop();

    if (guards.isTokenBridgeService(this.bridgeComponents.balancesBridgeDataProvider))
      this.bridgeComponents.balancesBridgeDataProvider.stop();

    if (guards.isTokenBridgeService(this.bridgeComponents.transfersBridgeDataProvider))
      this.bridgeComponents.transfersBridgeDataProvider.stop();

    this.rejectAndClearAllStatusWatchers('The TokenBridge has been stopped!');

    this._isStarted = false;
  }

  subscribeToAccount(accountAddress: string): void;
  subscribeToAccount(accountAddresses: readonly string[]): void;
  subscribeToAccount(accountAddressOrAddresses: string | readonly string[]): void;
  subscribeToAccount(accountAddressOrAddresses: string | readonly string[]): void {
    this.bridgeComponents.transfersBridgeDataProvider.subscribeToTokenTransfers(accountAddressOrAddresses);
  }

  unsubscribeFromAccount(accountAddress: string): void;
  unsubscribeFromAccount(accountAddresses: readonly string[]): void;
  unsubscribeFromAccount(accountAddressOrAddresses: string | readonly string[]): void;
  unsubscribeFromAccount(accountAddressOrAddresses: string | readonly string[]): void {
    this.bridgeComponents.transfersBridgeDataProvider.unsubscribeFromTokenTransfers(accountAddressOrAddresses);
  }

  subscribeToTokenTransfer(transfer: BridgeTokenTransfer): void;
  subscribeToTokenTransfer(operationHash: BridgeTokenTransfer): void;
  subscribeToTokenTransfer(operationHashOrTokenTransfer: string | BridgeTokenTransfer): void;
  subscribeToTokenTransfer(operationHashOrTokenTransfer: string | BridgeTokenTransfer): void {
    this.bridgeComponents.transfersBridgeDataProvider.subscribeToTokenTransfer(operationHashOrTokenTransfer);
  }

  unsubscribeFromTokenTransfer(transfer: BridgeTokenTransfer): void;
  unsubscribeFromTokenTransfer(operationHash: BridgeTokenTransfer): void;
  unsubscribeFromTokenTransfer(operationHashOrTokenTransfer: string | BridgeTokenTransfer): void;
  unsubscribeFromTokenTransfer(operationHashOrTokenTransfer: string | BridgeTokenTransfer): void;
  unsubscribeFromTokenTransfer(operationHashOrTokenTransfer: string | BridgeTokenTransfer): void {
    this.bridgeComponents.transfersBridgeDataProvider.unsubscribeFromTokenTransfer(operationHashOrTokenTransfer);
  }

  async waitForBridgeTokenTransferStatus(transfer: PendingBridgeTokenDeposit, status: BridgeTokenTransferStatus.Created): Promise<CreatedBridgeTokenDeposit>;
  async waitForBridgeTokenTransferStatus(transfer: PendingBridgeTokenDeposit | CreatedBridgeTokenDeposit, status: BridgeTokenTransferStatus.Finished): Promise<FinishedBridgeTokenDeposit>;
  async waitForBridgeTokenTransferStatus(transfer: PendingBridgeTokenWithdrawal, status: BridgeTokenTransferStatus.Created): Promise<CreatedBridgeTokenWithdrawal>;
  async waitForBridgeTokenTransferStatus(transfer: PendingBridgeTokenWithdrawal | CreatedBridgeTokenWithdrawal, status: BridgeTokenTransferStatus.Sealed): Promise<SealedBridgeTokenWithdrawal>;
  async waitForBridgeTokenTransferStatus(
    transfer: PendingBridgeTokenWithdrawal | CreatedBridgeTokenWithdrawal | SealedBridgeTokenWithdrawal,
    status: BridgeTokenTransferStatus.Finished
  ): Promise<FinishedBridgeTokenWithdrawal>;
  async waitForBridgeTokenTransferStatus(transfer: BridgeTokenTransfer, status: BridgeTokenTransferStatus): Promise<BridgeTokenTransfer>;
  async waitForBridgeTokenTransferStatus(transfer: BridgeTokenTransfer, status: BridgeTokenTransferStatus): Promise<BridgeTokenTransfer> {
    if (transfer.status >= status)
      return transfer;

    const operationHash = bridgeUtils.getInitialOperationHash(transfer);
    const updatedTransfer = await this.bridgeComponents.transfersBridgeDataProvider.getTokenTransfer(operationHash);
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
        this.bridgeComponents.transfersBridgeDataProvider.subscribeToTokenTransfer(operationHash);
        statusWatchers.set(status, {
          promise: watcherPromise,
          resolve: (updatedTransfer: BridgeTokenTransfer) => {
            this.bridgeComponents.transfersBridgeDataProvider.unsubscribeFromTokenTransfer(operationHash);
            resolve(updatedTransfer);
          },
          reject: (error: unknown) => {
            this.bridgeComponents.transfersBridgeDataProvider.unsubscribeFromTokenTransfer(operationHash);
            reject(error);
          }
        });
      }, 0);
    });

    return watcherPromise;
  }

  async deposit(amount: bigint, token: TezosToken): Promise<WalletDepositResult>;
  async deposit(amount: bigint, token: TezosToken, etherlinkReceiverAddress: string): Promise<WalletDepositResult>;
  async deposit(amount: bigint, token: TezosToken, options: WalletDepositOptions): Promise<WalletDepositResult>;
  async deposit(amount: bigint, token: TezosToken, options: DepositOptions): Promise<DepositResult>;
  async deposit(amount: bigint, token: TezosToken, etherlinkReceiverAddress: string, options: WalletDepositOptions): Promise<WalletDepositResult>;
  async deposit(amount: bigint, token: TezosToken, etherlinkReceiverAddress: string, options: DepositOptions): Promise<DepositResult>;
  async deposit(
    amount: bigint,
    token: TezosToken,
    etherlinkReceiverAddressOrOptions?: string | WalletDepositOptions | DepositOptions,
    options?: WalletDepositOptions | DepositOptions
  ): Promise<WalletDepositResult | DepositResult> {
    const etherlinkReceiverAddress = typeof etherlinkReceiverAddressOrOptions === 'string'
      ? etherlinkReceiverAddressOrOptions
      : await this.getEtherlinkConnectedAddress();
    const depositOptions = typeof etherlinkReceiverAddressOrOptions !== 'string' && etherlinkReceiverAddressOrOptions ? etherlinkReceiverAddressOrOptions : options;
    const useWalletApi = depositOptions && depositOptions.useWalletApi !== undefined ? depositOptions.useWalletApi : true;

    const tokenPair = await this.bridgeComponents.tokensBridgeDataProvider.getRegisteredTokenPair(token);
    if (!tokenPair)
      throw new Error(`Token (${token.type}${token.type === 'fa1.2' ? ', ' + token.address : ''}${token.type === 'fa2' ? ', ' + token.tokenId : ''}) is not listed`);

    const ticketHelperContractAddress = tokenPair.tezos.ticketHelperContractAddress;

    const depositOperation = await (useWalletApi
      ? this.depositUsingWalletApi(
        token,
        amount,
        etherlinkReceiverAddress,
        depositOptions as WalletDepositOptions,
        ticketHelperContractAddress
      )
      : this.depositUsingContractApi(
        token,
        amount,
        etherlinkReceiverAddress,
        depositOptions as DepositOptions,
        ticketHelperContractAddress
      )
    );

    (this.events.tokenTransferCreated as ToEventEmitter<typeof this.events.tokenTransferCreated>).emit(depositOperation.tokenTransfer);

    return depositOperation;
  }

  async startWithdraw(amount: bigint, token: NonNativeEtherlinkToken, tezosReceiverAddress?: string): Promise<StartWithdrawResult> {
    if (!tezosReceiverAddress) {
      tezosReceiverAddress = await this.getTezosConnectedAddress();
    }

    const tokenPair = await this.bridgeComponents.tokensBridgeDataProvider.getRegisteredTokenPair(token);
    if (!tokenPair)
      throw new Error(`Token (${token.address}) is not listed`);
    if (tokenPair.etherlink.type === 'native' || tokenPair.tezos.type === 'native')
      throw new Error('Withdrawal of native tokens is not supported yet');

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
    const bridgeTokenWithdrawal: StartWithdrawResult['tokenTransfer'] = {
      kind: BridgeTokenTransferKind.Withdrawal,
      status: BridgeTokenTransferStatus.Pending,
      source: etherlinkUtils.toChecksumAddress(withdrawalTransactionReceipt.from),
      receiver: tezosReceiverAddress,
      etherlinkOperation: {
        hash: withdrawalTransactionReceipt.transactionHash.toString(),
        timestamp: Date.now().toString(),
        amount,
        token,
      }
    };

    (this.events.tokenTransferCreated as ToEventEmitter<typeof this.events.tokenTransferCreated>).emit(bridgeTokenWithdrawal);

    return {
      tokenTransfer: bridgeTokenWithdrawal,
      startWithdrawOperation: withdrawalTransactionReceipt
    };
  }

  async finishWithdraw(sealedBridgeTokenWithdrawal: SealedBridgeTokenWithdrawal): Promise<FinishWithdrawResult> {
    const finishWithdrawOperation = await this.bridgeComponents.tezos.finishWithdraw(
      sealedBridgeTokenWithdrawal.rollupData.commitment,
      sealedBridgeTokenWithdrawal.rollupData.proof
    );

    return {
      tokenTransfer: sealedBridgeTokenWithdrawal,
      finishWithdrawOperation
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

  // #region Data API

  protected getBalance(accountAddress: string, token: TezosToken | EtherlinkToken): Promise<AccountTokenBalanceInfo> {
    return this.bridgeComponents.balancesBridgeDataProvider.getBalance(accountAddress, token);
  }

  protected getBalances(accountAddress: string): Promise<AccountTokenBalanceInfo>;
  protected getBalances(accountAddress: string, tokens: ReadonlyArray<TezosToken | EtherlinkToken>): Promise<AccountTokenBalanceInfo>;
  protected getBalances(accountAddress: string, offset: number, limit: number): Promise<AccountTokenBalanceInfo>;
  protected getBalances(
    accountAddress: string,
    tokensOrOffset?: ReadonlyArray<TezosToken | EtherlinkToken> | number,
    limit?: number
  ): Promise<AccountTokenBalanceInfo>;
  protected getBalances(
    accountAddress: string,
    tokensOrOffset?: ReadonlyArray<TezosToken | EtherlinkToken> | number,
    limit?: number
  ): Promise<AccountTokenBalanceInfo> {
    return this.bridgeComponents.balancesBridgeDataProvider.getBalances(accountAddress, tokensOrOffset, limit);
  }

  protected getRegisteredTokenPair(token: TezosToken | EtherlinkToken): Promise<TokenPair | null> {
    return this.bridgeComponents.tokensBridgeDataProvider.getRegisteredTokenPair(token);
  }

  protected getRegisteredTokenPairs(): Promise<TokenPair[]>;
  protected getRegisteredTokenPairs(offset: number, limit: number): Promise<TokenPair[]>;
  protected getRegisteredTokenPairs(offset?: number, limit?: number): Promise<TokenPair[]>;
  protected getRegisteredTokenPairs(offset?: number, limit?: number): Promise<TokenPair[]> {
    return this.bridgeComponents.tokensBridgeDataProvider.getRegisteredTokenPairs(offset, limit);
  }

  protected getTokenTransfer(operationHash: string): Promise<BridgeTokenTransfer | null>;
  protected getTokenTransfer(tokenTransfer: BridgeTokenTransfer): Promise<BridgeTokenTransfer | null>;
  protected getTokenTransfer(operationHashOrTokenTransfer: string | BridgeTokenTransfer): Promise<BridgeTokenTransfer | null>;
  protected getTokenTransfer(operationHashOrTokenTransfer: string | BridgeTokenTransfer): Promise<BridgeTokenTransfer | null> {
    return this.bridgeComponents.transfersBridgeDataProvider.getTokenTransfer(operationHashOrTokenTransfer);
  }

  protected getTokenTransfers(): Promise<BridgeTokenTransfer[]>;
  protected getTokenTransfers(offset: number, limit: number): Promise<BridgeTokenTransfer[]>;
  protected getTokenTransfers(accountAddress: string): Promise<BridgeTokenTransfer[]>;
  protected getTokenTransfers(accountAddresses: readonly string[]): Promise<BridgeTokenTransfer[]>;
  protected getTokenTransfers(accountAddress: string, offset: number, limit: number): Promise<BridgeTokenTransfer[]>;
  protected getTokenTransfers(accountAddresses: readonly string[], offset: number, limit: number): Promise<BridgeTokenTransfer[]>;
  protected getTokenTransfers(
    offsetOrAccountAddressOfAddresses?: number | string | readonly string[],
    offsetOrLimit?: number,
    limitParameter?: number
  ): Promise<BridgeTokenTransfer[]>;
  protected getTokenTransfers(
    offsetOrAccountAddressOfAddresses?: number | string | readonly string[],
    offsetOrLimit?: number,
    limitParameter?: number
  ): Promise<BridgeTokenTransfer[]> {
    return this.bridgeComponents.transfersBridgeDataProvider.getTokenTransfers(
      offsetOrAccountAddressOfAddresses,
      offsetOrLimit,
      limitParameter
    );
  }

  // #endregion

  protected resolveStatusWatcherIfNeeded(tokenTransfer: BridgeTokenTransfer) {
    const initialOperationHash = bridgeUtils.getInitialOperationHash(tokenTransfer);
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

  protected rejectAndClearAllStatusWatchers(error: unknown) {
    for (const statusWatchers of this.tokenTransferOperationWatchers.values()) {
      for (const statusWatcher of statusWatchers.values()) {
        statusWatcher.reject(error);
      }

      statusWatchers.clear();
    }

    this.tokenTransferOperationWatchers.clear();
  }

  protected attachEvents() {
    this.bridgeComponents.transfersBridgeDataProvider.events.tokenTransferCreated.addListener(this.handleTransfersBridgeDataProviderTokenTransferCreated);
    this.bridgeComponents.transfersBridgeDataProvider.events.tokenTransferUpdated.addListener(this.handleTransfersBridgeDataProviderTokenTransferUpdated);
  }

  protected detachEvents() {
    this.bridgeComponents.transfersBridgeDataProvider.events.tokenTransferUpdated.removeListener(this.handleTransfersBridgeDataProviderTokenTransferUpdated);
    this.bridgeComponents.transfersBridgeDataProvider.events.tokenTransferCreated.removeListener(this.handleTransfersBridgeDataProviderTokenTransferCreated);
  }

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
    ticketHelperOrNativeTokenTicketerContractAddress: string
  ): Promise<WalletDepositResult> {
    const isNativeToken = token.type === 'native';

    const [depositOperation, sourceAddress] = await Promise.all([
      isNativeToken
        ? this.bridgeComponents.tezos.wallet.depositNativeToken({
          amount,
          etherlinkReceiverAddress,
          ticketHelperContractAddress: ticketHelperOrNativeTokenTicketerContractAddress,
        })
        : this.bridgeComponents.tezos.wallet.depositNonNativeToken({
          token,
          amount,
          etherlinkReceiverAddress,
          ticketHelperContractAddress: ticketHelperOrNativeTokenTicketerContractAddress
        }),
      this.getTezosConnectedAddress()
    ]);

    return {
      tokenTransfer: {
        kind: BridgeTokenTransferKind.Deposit,
        status: BridgeTokenTransferStatus.Pending,
        source: sourceAddress,
        receiver: etherlinkReceiverAddress,
        tezosOperation: {
          hash: depositOperation.opHash,
          timestamp: new Date().toISOString(),
          amount,
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
    ticketHelperOrNativeTokenTicketerContractAddress: string
  ): Promise<DepositResult> {
    const isNativeToken = token.type === 'native';

    const depositOperation = await (isNativeToken
      ? this.bridgeComponents.tezos.depositNativeToken({
        amount,
        etherlinkReceiverAddress,
        ticketHelperContractAddress: ticketHelperOrNativeTokenTicketerContractAddress
      })
      : this.bridgeComponents.tezos.depositNonNativeToken({
        token,
        amount,
        etherlinkReceiverAddress,
        ticketHelperContractAddress: ticketHelperOrNativeTokenTicketerContractAddress
      })
    );

    return {
      tokenTransfer: {
        kind: BridgeTokenTransferKind.Deposit,
        status: BridgeTokenTransferStatus.Pending,
        source: depositOperation.source,
        receiver: etherlinkReceiverAddress,
        tezosOperation: {
          hash: depositOperation.hash,
          timestamp: new Date().toISOString(),
          amount,
          token,
        }
      },
      depositOperation
    };
  }

  private async getTezosTicketerContent(tezosTicketerAddress: string): Promise<string> {
    const storage = await this.tezosToolkit.contract.getStorage<{ content: any }>(tezosTicketerAddress);
    const content = [...Object.values(storage.content)];
    const contentMichelsonData = this.tezosTicketerContentSchema.Encode(content);

    return '0x' + packDataBytes(contentMichelsonData, tezosTicketerContentMichelsonType).bytes.slice(2);
  }
}
