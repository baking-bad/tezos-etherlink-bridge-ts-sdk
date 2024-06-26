import { EtherlinkSignerAccountUnavailableError, FailedTokenTransferError, InsufficientBalanceError, TezosSignerAccountUnavailableError, TokenBridgeDisposed, TokenPairNotFoundError } from './errors';
import type { TokenBridgeComponents } from './tokenBridgeComponents';
import type { SignerTokenBalances, TokenBridgeDataApi } from './tokenBridgeDataApi';
import type { TokenBridgeOptions } from './tokenBridgeOptions';
import type { TokenBridgeStreamApi } from './tokenBridgeStreamApi';
import type { EtherlinkBridgeBlockchainService, TezosBridgeBlockchainService } from '../bridgeBlockchainService';
import {
  BridgeTokenTransferKind, BridgeTokenTransferStatus,
  type TokenPair,
  type DepositOptions, type DepositResult, type StartWithdrawResult, type FinishWithdrawResult,

  type BridgeTokenTransfer,
  type PendingBridgeTokenDeposit, type CreatedBridgeTokenDeposit, type FinishedBridgeTokenDeposit,
  type PendingBridgeTokenWithdrawal, type CreatedBridgeTokenWithdrawal, type SealedBridgeTokenWithdrawal, type FinishedBridgeTokenWithdrawal
} from '../bridgeCore';
import type {
  AccountTokenBalance, AccountTokenBalances,
  BalancesFetchOptions, TokensFetchOptions, TransfersFetchOptions
} from '../bridgeDataProviders';
import { EventEmitter, ToEventEmitter, type PublicEventEmitter } from '../common';
import {
  loggerProvider,
  getTokenLogMessage, getBridgeTokenTransferLogMessage, getDetailedBridgeTokenTransferLogMessage, getErrorLogMessage
} from '../logging';
import type {
  TezosToken, NativeTezosToken, NonNativeTezosToken,
  EtherlinkToken, NativeEtherlinkToken, NonNativeEtherlinkToken
} from '../tokens';
import { bridgeUtils, guards } from '../utils';

interface TokenBridgeComponentsEvents {
  readonly tokenTransferCreated: PublicEventEmitter<readonly [tokenTransfer: BridgeTokenTransfer]>;
  readonly tokenTransferUpdated: PublicEventEmitter<readonly [tokenTransfer: BridgeTokenTransfer]>;
}

export class TokenBridge<
  TTezosBridgeBlockchainService extends TezosBridgeBlockchainService = TezosBridgeBlockchainService,
  TEtherlinkBridgeBlockchainService extends EtherlinkBridgeBlockchainService = EtherlinkBridgeBlockchainService
> implements Disposable {
  private static readonly defaultLastCreatedTokenTransfersTimerPeriod = 60_000;
  private static readonly defaultLastCreatedTokenTransferLifetime = 30_000;

  readonly data: TokenBridgeDataApi;
  readonly stream: TokenBridgeStreamApi;
  readonly bridgeComponents: TokenBridgeComponents<TTezosBridgeBlockchainService, TEtherlinkBridgeBlockchainService>;

  protected readonly events: TokenBridgeComponentsEvents = {
    tokenTransferCreated: new EventEmitter(),
    tokenTransferUpdated: new EventEmitter()
  };

  protected readonly tokenTransferStatusWatchers = new Map<
    string,
    Map<BridgeTokenTransferStatus, {
      readonly promise: Promise<BridgeTokenTransfer>,
      readonly resolve: (transfer: BridgeTokenTransfer) => void,
      readonly reject: (error: unknown) => void
    }>
  >();

  private readonly lastCreatedTokenTransfers: Map<string, readonly [tokenTransfer: BridgeTokenTransfer, addedTime: number]> = new Map();
  private lastCreatedTokenTransfersTimerId: ReturnType<typeof setInterval> | undefined;
  private _isDisposed = false;

  constructor(options: TokenBridgeOptions<TTezosBridgeBlockchainService, TEtherlinkBridgeBlockchainService>) {
    this.bridgeComponents = {
      tezosBridgeBlockchainService: options.tezosBridgeBlockchainService,
      etherlinkBridgeBlockchainService: options.etherlinkBridgeBlockchainService,
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
      getAccountTokenTransfers: this.getAccountTokenTransfers.bind(this),
      getOperationTokenTransfers: this.getOperationTokenTransfers.bind(this),
      getSignerBalances: this.getSignerBalances.bind(this),
      getSignerTokenTransfers: this.getSignerTokenTransfers.bind(this),
    };
    this.stream = {
      subscribeToTokenTransfer: this.subscribeToTokenTransfer.bind(this),
      subscribeToTokenTransfers: this.subscribeToTokenTransfers.bind(this),
      subscribeToAccountTokenTransfers: this.subscribeToAccountTokenTransfers.bind(this),
      subscribeToOperationTokenTransfers: this.subscribeToOperationTokenTransfers.bind(this),
      unsubscribeFromTokenTransfer: this.unsubscribeFromTokenTransfer.bind(this),
      unsubscribeFromTokenTransfers: this.unsubscribeFromTokenTransfers.bind(this),
      unsubscribeFromAccountTokenTransfers: this.unsubscribeFromAccountTokenTransfers.bind(this),
      unsubscribeFromOperationTokenTransfers: this.unsubscribeFromOperationTokenTransfers.bind(this),
      unsubscribeFromAllSubscriptions: this.unsubscribeFromAllSubscriptions.bind(this)
    };

    this.attachEvents();
  }

  get isDisposed() {
    return this._isDisposed;
  }

  addEventListener<EventType extends keyof TokenBridgeComponentsEvents>(
    type: EventType,
    listener: Parameters<TokenBridgeComponentsEvents[EventType]['addListener']>[0]
  ): void {
    this.ensureIsNotDisposed();
    this.events[type].addListener(listener as any);
  }

  removeEventListener<EventType extends keyof TokenBridgeComponentsEvents>(
    type: EventType,
    listener: Parameters<TokenBridgeComponentsEvents[EventType]['addListener']>[0]
  ): void {
    this.ensureIsNotDisposed();
    this.events[type].removeListener(listener as any);
  }

  removeAllEventListeners<EventType extends keyof TokenBridgeComponentsEvents>(type: EventType): void {
    this.ensureIsNotDisposed();
    this.events[type].removeAllListeners();
  }

  async waitForStatus(transfer: PendingBridgeTokenDeposit, status: BridgeTokenTransferStatus.Created): Promise<CreatedBridgeTokenDeposit>;
  async waitForStatus(transfer: PendingBridgeTokenDeposit | CreatedBridgeTokenDeposit, status: BridgeTokenTransferStatus.Finished): Promise<FinishedBridgeTokenDeposit>;
  async waitForStatus(transfer: PendingBridgeTokenWithdrawal, status: BridgeTokenTransferStatus.Created): Promise<CreatedBridgeTokenWithdrawal>;
  async waitForStatus(transfer: PendingBridgeTokenWithdrawal | CreatedBridgeTokenWithdrawal, status: BridgeTokenTransferStatus.Sealed): Promise<SealedBridgeTokenWithdrawal>;
  async waitForStatus(
    transfer: PendingBridgeTokenWithdrawal | CreatedBridgeTokenWithdrawal | SealedBridgeTokenWithdrawal,
    status: BridgeTokenTransferStatus.Finished
  ): Promise<FinishedBridgeTokenWithdrawal>;
  async waitForStatus(transfer: BridgeTokenTransfer, status: BridgeTokenTransferStatus): Promise<BridgeTokenTransfer>;
  async waitForStatus(transfer: BridgeTokenTransfer, status: BridgeTokenTransferStatus): Promise<BridgeTokenTransfer> {
    this.ensureIsNotDisposed();
    if (transfer.status >= status)
      return transfer;

    const isPending = transfer.status === BridgeTokenTransferStatus.Pending;
    const updatedTransfers = await (isPending
      ? this.bridgeComponents.transfersBridgeDataProvider.getOperationTokenTransfers(transfer)
      : this.bridgeComponents.transfersBridgeDataProvider.getTokenTransfer(transfer.id));
    const updatedTransfer = guards.isArray(updatedTransfers) ? updatedTransfers[0] : updatedTransfers;

    if (updatedTransfer?.status === status)
      return updatedTransfer;

    const statusWatcherKey = isPending ? bridgeUtils.getInitialOperation(transfer).hash : transfer.id;
    let statusWatchers = this.tokenTransferStatusWatchers.get(statusWatcherKey);
    if (!statusWatchers) {
      statusWatchers = new Map();
      this.tokenTransferStatusWatchers.set(statusWatcherKey, statusWatchers);
    }

    const watcher = statusWatchers.get(status);
    if (watcher)
      return watcher.promise;

    const watcherPromise = new Promise<BridgeTokenTransfer>((resolve, reject) => {
      const statusWatchers = this.tokenTransferStatusWatchers.get(statusWatcherKey);
      if (!statusWatchers) {
        reject(`Status watchers map not found for the ${statusWatcherKey} token transfer`);
        return;
      }

      setTimeout(() => {
        try {
          this.bridgeComponents.transfersBridgeDataProvider[isPending ? 'subscribeToOperationTokenTransfers' : 'subscribeToTokenTransfer'](statusWatcherKey);

          statusWatchers.set(status, {
            promise: watcherPromise,
            resolve: (updatedTransfer: BridgeTokenTransfer) => {
              this.bridgeComponents.transfersBridgeDataProvider[isPending ? 'unsubscribeFromOperationTokenTransfers' : 'unsubscribeFromTokenTransfer'](statusWatcherKey);
              resolve(updatedTransfer);
            },
            reject: (error: unknown) => {
              this.bridgeComponents.transfersBridgeDataProvider[isPending ? 'unsubscribeFromOperationTokenTransfers' : 'unsubscribeFromTokenTransfer'](statusWatcherKey);
              reject(error);
            }
          });
        }
        catch (error) {
          loggerProvider.logger.error(getErrorLogMessage(error));
          reject(error);
        }
      }, 0);
    });

    return watcherPromise;
  }

  async deposit(amount: bigint, token: NativeTezosToken): Promise<DepositResult<TTezosBridgeBlockchainService['depositNativeToken']>>;
  async deposit(amount: bigint, token: NativeTezosToken, etherlinkReceiverAddress: string): Promise<DepositResult<TTezosBridgeBlockchainService['depositNativeToken']>>;
  async deposit(amount: bigint, token: NativeTezosToken, options: DepositOptions): Promise<DepositResult<TTezosBridgeBlockchainService['depositNativeToken']>>;
  async deposit(amount: bigint, token: NativeTezosToken, etherlinkReceiverAddress: string, options: DepositOptions): Promise<DepositResult<TTezosBridgeBlockchainService['depositNativeToken']>>;
  async deposit(amount: bigint, token: NonNativeTezosToken): Promise<DepositResult<TTezosBridgeBlockchainService['depositNonNativeToken']>>;
  async deposit(amount: bigint, token: NonNativeTezosToken, etherlinkReceiverAddress: string): Promise<DepositResult<TTezosBridgeBlockchainService['depositNonNativeToken']>>;
  async deposit(amount: bigint, token: NonNativeTezosToken, options: DepositOptions): Promise<DepositResult<TTezosBridgeBlockchainService['depositNonNativeToken']>>;
  async deposit(amount: bigint, token: NonNativeTezosToken, etherlinkReceiverAddress: string, options: DepositOptions): Promise<DepositResult<TTezosBridgeBlockchainService['depositNonNativeToken']>>;
  async deposit(
    amount: bigint,
    token: TezosToken,
    etherlinkReceiverAddressOrOptions?: string | DepositOptions,
    options?: DepositOptions
  ): Promise<DepositResult<TTezosBridgeBlockchainService['depositNativeToken']> | DepositResult<TTezosBridgeBlockchainService['depositNonNativeToken']>>;
  async deposit(
    amount: bigint,
    token: TezosToken,
    etherlinkReceiverAddressOrOptions?: string | DepositOptions,
    options?: DepositOptions
  ): Promise<DepositResult<TTezosBridgeBlockchainService['depositNativeToken']> | DepositResult<TTezosBridgeBlockchainService['depositNonNativeToken']>> {
    this.ensureIsNotDisposed();

    const tezosSourceAddress = await this.getRequiredTezosSignerAddress();
    const etherlinkReceiverAddress = typeof etherlinkReceiverAddressOrOptions === 'string'
      ? etherlinkReceiverAddressOrOptions
      : await this.getRequiredEtherlinkSignerAddress();
    const depositOptions = typeof etherlinkReceiverAddressOrOptions !== 'string' && etherlinkReceiverAddressOrOptions ? etherlinkReceiverAddressOrOptions : options;

    loggerProvider.lazyLogger.log?.(
      `Depositing ${amount.toString(10)} ${getTokenLogMessage(token)} from ${tezosSourceAddress} to ${etherlinkReceiverAddress}`
    );

    const tokenPair = await this.bridgeComponents.tokensBridgeDataProvider.getRegisteredTokenPair(token);
    if (!tokenPair) {
      const error = new TokenPairNotFoundError(token);
      loggerProvider.logger.error(getErrorLogMessage(error));
      throw error;
    }
    const accountTokenBalance = await this.bridgeComponents.balancesBridgeDataProvider.getBalance(tezosSourceAddress, token);
    if (amount > accountTokenBalance.balance) {
      const error = new InsufficientBalanceError(token, tezosSourceAddress, accountTokenBalance.balance, amount);
      loggerProvider.logger.error(getErrorLogMessage(error));
      throw error;
    }
    loggerProvider.logger.log(`The ${tezosSourceAddress} has enough tokens to deposit ${amount}`);

    const operationResult = await (token.type === 'native'
      ? this.bridgeComponents.tezosBridgeBlockchainService.depositNativeToken({
        amount,
        etherlinkReceiverAddress,
        ticketHelperContractAddress: tokenPair.tezos.ticketHelperContractAddress,
      })
      : this.bridgeComponents.tezosBridgeBlockchainService.depositNonNativeToken({
        token,
        amount,
        etherlinkReceiverAddress,
        ticketHelperContractAddress: tokenPair.tezos.ticketHelperContractAddress,
        useApprove: depositOptions?.useApprove,
        resetFA12Approve: depositOptions?.resetFA12Approve,
      })
    );
    loggerProvider.logger.log('The deposit operation has been created:', operationResult.hash);

    const tokenTransfer: PendingBridgeTokenDeposit = {
      kind: BridgeTokenTransferKind.Deposit,
      status: BridgeTokenTransferStatus.Pending,
      source: tezosSourceAddress,
      receiver: etherlinkReceiverAddress,
      tezosOperation: {
        hash: operationResult.hash,
        amount: operationResult.amount,
        timestamp: operationResult.timestamp,
        token,
      }
    };

    loggerProvider.lazyLogger.log?.(getBridgeTokenTransferLogMessage(tokenTransfer));
    loggerProvider.lazyLogger.debug?.(getDetailedBridgeTokenTransferLogMessage(tokenTransfer));

    this.emitLocalTokenTransferCreatedEvent(tokenTransfer);

    return {
      tokenTransfer,
      operationResult
    } as DepositResult<TTezosBridgeBlockchainService['depositNativeToken']> | DepositResult<TTezosBridgeBlockchainService['depositNonNativeToken']>;
  }

  async startWithdraw(
    amount: bigint,
    token: NativeEtherlinkToken,
    tezosReceiverAddress?: string
  ): Promise<StartWithdrawResult<TEtherlinkBridgeBlockchainService['withdrawNativeToken']>>;
  async startWithdraw(
    amount: bigint,
    token: NonNativeEtherlinkToken,
    tezosReceiverAddress?: string
  ): Promise<StartWithdrawResult<TEtherlinkBridgeBlockchainService['withdrawNonNativeToken']>>;
  async startWithdraw(
    amount: bigint,
    token: EtherlinkToken,
    tezosReceiverAddress?: string
  ): Promise<StartWithdrawResult<TEtherlinkBridgeBlockchainService['withdrawNativeToken']> | StartWithdrawResult<TEtherlinkBridgeBlockchainService['withdrawNonNativeToken']>>;
  async startWithdraw(
    amount: bigint,
    token: EtherlinkToken,
    tezosReceiverAddress?: string
  ): Promise<StartWithdrawResult<TEtherlinkBridgeBlockchainService['withdrawNativeToken']> | StartWithdrawResult<TEtherlinkBridgeBlockchainService['withdrawNonNativeToken']>> {
    this.ensureIsNotDisposed();

    const etherlinkSourceAddress = await this.getRequiredEtherlinkSignerAddress();
    if (!tezosReceiverAddress) {
      tezosReceiverAddress = await this.getRequiredTezosSignerAddress();
    }

    const tokenPair = await this.bridgeComponents.tokensBridgeDataProvider.getRegisteredTokenPair(token);
    if (!tokenPair) {
      const error = new TokenPairNotFoundError(token);
      loggerProvider.logger.error(getErrorLogMessage(error));
      throw error;
    }
    const accountTokenBalance = await this.bridgeComponents.balancesBridgeDataProvider.getBalance(etherlinkSourceAddress, token);
    if (amount > accountTokenBalance.balance) {
      const error = new InsufficientBalanceError(token, etherlinkSourceAddress, accountTokenBalance.balance, amount);
      loggerProvider.logger.error(getErrorLogMessage(error));
      throw error;
    }
    loggerProvider.logger.log(`The ${etherlinkSourceAddress} has enough tokens to withdraw ${amount}`);

    let operationResult: Awaited<ReturnType<typeof this.startWithdraw>>['operationResult'];
    if (tokenPair.tezos.type === 'native') {
      operationResult = (await this.bridgeComponents.etherlinkBridgeBlockchainService.withdrawNativeToken({
        amount,
        tezosReceiverAddress,
      }) as Awaited<ReturnType<typeof this.startWithdraw>>['operationResult']);
    }
    else {
      const tezosTicketerAddress = tokenPair.tezos.ticketerContractAddress;
      const tezosTicketerContent = await this.bridgeComponents.tezosBridgeBlockchainService.getTezosTicketerContent(tezosTicketerAddress);

      operationResult = (await this.bridgeComponents.etherlinkBridgeBlockchainService.withdrawNonNativeToken({
        amount,
        tezosReceiverAddress,
        tezosTicketerAddress,
        tezosTicketerContent,
        token: token as NonNativeEtherlinkToken
      }) as Awaited<ReturnType<typeof this.startWithdraw>>['operationResult']);
    }

    const bridgeTokenWithdrawal: PendingBridgeTokenWithdrawal = {
      kind: BridgeTokenTransferKind.Withdrawal,
      status: BridgeTokenTransferStatus.Pending,
      source: etherlinkSourceAddress,
      receiver: tezosReceiverAddress,
      etherlinkOperation: {
        hash: operationResult.hash,
        amount,
        timestamp: operationResult.timestamp,
        token,
      }
    };

    this.emitLocalTokenTransferCreatedEvent(bridgeTokenWithdrawal);

    return {
      tokenTransfer: bridgeTokenWithdrawal,
      operationResult
    };
  }

  async finishWithdraw(
    sealedBridgeTokenWithdrawal: SealedBridgeTokenWithdrawal
  ): Promise<FinishWithdrawResult<TTezosBridgeBlockchainService['finishWithdraw']>> {
    this.ensureIsNotDisposed();

    const operationResult = await this.bridgeComponents.tezosBridgeBlockchainService.finishWithdraw({
      cementedCommitment: sealedBridgeTokenWithdrawal.rollupData.commitment,
      outputProof: sealedBridgeTokenWithdrawal.rollupData.proof
    });

    return {
      tokenTransfer: sealedBridgeTokenWithdrawal,
      operationResult
    } as FinishWithdrawResult<TTezosBridgeBlockchainService['finishWithdraw']>;
  }

  async getTezosSignerAddress(): Promise<string | undefined> {
    this.ensureIsNotDisposed();

    return this.bridgeComponents.tezosBridgeBlockchainService.getSignerAddress();
  }

  async getEtherlinkSignerAddress(): Promise<string | undefined> {
    this.ensureIsNotDisposed();

    return this.bridgeComponents.etherlinkBridgeBlockchainService.getSignerAddress();
  }

  [Symbol.dispose](): void {
    if (this._isDisposed)
      return;

    if (guards.isDisposable(this.bridgeComponents.tokensBridgeDataProvider))
      this.bridgeComponents.tokensBridgeDataProvider[Symbol.dispose]();

    if (guards.isDisposable(this.bridgeComponents.balancesBridgeDataProvider))
      this.bridgeComponents.balancesBridgeDataProvider[Symbol.dispose]();

    if (guards.isDisposable(this.bridgeComponents.transfersBridgeDataProvider))
      this.bridgeComponents.transfersBridgeDataProvider[Symbol.dispose]();

    this.rejectAndClearAllStatusWatchers(new TokenBridgeDisposed());
    this.detachEvents();
    clearInterval(this.lastCreatedTokenTransfersTimerId);
    this.lastCreatedTokenTransfers.clear();

    this._isDisposed = true;
  }

  // #region Data API

  protected getBalance(accountAddress: string, token: TezosToken | EtherlinkToken): Promise<AccountTokenBalance> {
    return this.bridgeComponents.balancesBridgeDataProvider.getBalance(accountAddress, token);
  }

  protected getBalances(accountAddress: string): Promise<AccountTokenBalances>;
  protected getBalances(accountAddress: string, tokens: ReadonlyArray<TezosToken | EtherlinkToken>): Promise<AccountTokenBalances>;
  protected getBalances(accountAddress: string, fetchOptions: BalancesFetchOptions): Promise<AccountTokenBalances>;
  protected getBalances(
    accountAddress: string,
    tokensOfFetchOptions?: ReadonlyArray<TezosToken | EtherlinkToken> | BalancesFetchOptions
  ): Promise<AccountTokenBalances>;
  protected getBalances(
    accountAddress: string,
    tokensOfFetchOptions?: ReadonlyArray<TezosToken | EtherlinkToken> | BalancesFetchOptions
  ): Promise<AccountTokenBalances> {
    return this.bridgeComponents.balancesBridgeDataProvider.getBalances(accountAddress, tokensOfFetchOptions);
  }

  protected getRegisteredTokenPair(token: TezosToken | EtherlinkToken): Promise<TokenPair | null> {
    return this.bridgeComponents.tokensBridgeDataProvider.getRegisteredTokenPair(token);
  }

  protected getRegisteredTokenPairs(): Promise<TokenPair[]>;
  protected getRegisteredTokenPairs(fetchOptions: TokensFetchOptions): Promise<TokenPair[]>;
  protected getRegisteredTokenPairs(fetchOptions?: TokensFetchOptions): Promise<TokenPair[]>;
  protected getRegisteredTokenPairs(fetchOptions?: TokensFetchOptions): Promise<TokenPair[]> {
    return this.bridgeComponents.tokensBridgeDataProvider.getRegisteredTokenPairs(fetchOptions);
  }

  protected getTokenTransfer(tokenTransferId: string): Promise<BridgeTokenTransfer | null> {
    return this.bridgeComponents.transfersBridgeDataProvider.getTokenTransfer(tokenTransferId);
  }

  protected getTokenTransfers(): Promise<BridgeTokenTransfer[]>;
  protected getTokenTransfers(fetchOptions: TransfersFetchOptions): Promise<BridgeTokenTransfer[]>;
  protected getTokenTransfers(fetchOptions?: TransfersFetchOptions): Promise<BridgeTokenTransfer[]>;
  protected getTokenTransfers(fetchOptions?: TransfersFetchOptions): Promise<BridgeTokenTransfer[]> {
    return this.bridgeComponents.transfersBridgeDataProvider.getTokenTransfers(fetchOptions);
  }

  protected getAccountTokenTransfers(accountAddress: string): Promise<BridgeTokenTransfer[]>;
  protected getAccountTokenTransfers(accountAddresses: readonly string[]): Promise<BridgeTokenTransfer[]>;
  protected getAccountTokenTransfers(accountAddress: string, fetchOptions: TransfersFetchOptions): Promise<BridgeTokenTransfer[]>;
  protected getAccountTokenTransfers(accountAddresses: readonly string[], fetchOptions: TransfersFetchOptions): Promise<BridgeTokenTransfer[]>;
  protected getAccountTokenTransfers(accountAddressOrAddresses: string | readonly string[], fetchOptions?: TransfersFetchOptions): Promise<BridgeTokenTransfer[]>;
  protected getAccountTokenTransfers(accountAddressOrAddresses: string | readonly string[], fetchOptions?: TransfersFetchOptions): Promise<BridgeTokenTransfer[]> {
    return this.bridgeComponents.transfersBridgeDataProvider
      .getAccountTokenTransfers(accountAddressOrAddresses, fetchOptions);
  }

  protected getOperationTokenTransfers(operationHash: string): Promise<BridgeTokenTransfer[]>;
  protected getOperationTokenTransfers(tokenTransfer: BridgeTokenTransfer): Promise<BridgeTokenTransfer[]>;
  protected getOperationTokenTransfers(operationHashOrTokenTransfer: string | BridgeTokenTransfer): Promise<BridgeTokenTransfer[]>;
  protected getOperationTokenTransfers(operationHashOrTokenTransfer: string | BridgeTokenTransfer): Promise<BridgeTokenTransfer[]> {
    return this.bridgeComponents.transfersBridgeDataProvider.getOperationTokenTransfers(operationHashOrTokenTransfer);
  }

  protected async getSignerBalances(): Promise<SignerTokenBalances> {
    const [tezosSignerBalances, etherlinkSignerBalances] = await Promise.all([
      this.getTezosSignerAddress()
        .then(signerAddress => signerAddress ? this.getBalances(signerAddress) : undefined),
      this.getEtherlinkSignerAddress()
        .then(signerAddress => signerAddress ? this.getBalances(signerAddress) : undefined),
    ]);

    return {
      tezosSignerBalances,
      etherlinkSignerBalances
    };
  }

  protected async getSignerTokenTransfers(): Promise<BridgeTokenTransfer[]>;
  protected async getSignerTokenTransfers(fetchOptions: TransfersFetchOptions): Promise<BridgeTokenTransfer[]>;
  protected async getSignerTokenTransfers(fetchOptions?: TransfersFetchOptions): Promise<BridgeTokenTransfer[]>;
  protected async getSignerTokenTransfers(fetchOptions?: TransfersFetchOptions): Promise<BridgeTokenTransfer[]> {
    const [tezosSignerAddress, etherlinkSignerAddress] = await Promise.all([
      this.getTezosSignerAddress(),
      this.getEtherlinkSignerAddress()
    ]);

    const addresses = tezosSignerAddress && etherlinkSignerAddress
      ? [tezosSignerAddress, etherlinkSignerAddress]
      : tezosSignerAddress || etherlinkSignerAddress;

    return addresses
      ? this.getAccountTokenTransfers(addresses, fetchOptions)
      : [];
  }

  // #endregion

  // #region Stream API

  protected subscribeToTokenTransfer(tokenTransferId: string): void {
    this.bridgeComponents.transfersBridgeDataProvider.subscribeToTokenTransfer(tokenTransferId);
  }

  protected unsubscribeFromTokenTransfer(tokenTransferId: string): void {
    this.bridgeComponents.transfersBridgeDataProvider.unsubscribeFromTokenTransfer(tokenTransferId);
  }

  protected subscribeToTokenTransfers(): void {
    this.bridgeComponents.transfersBridgeDataProvider.subscribeToTokenTransfers();
  }

  protected unsubscribeFromTokenTransfers(): void {
    this.bridgeComponents.transfersBridgeDataProvider.unsubscribeFromTokenTransfers();
  }

  protected subscribeToAccountTokenTransfers(accountAddress: string): void;
  protected subscribeToAccountTokenTransfers(accountAddresses: readonly string[]): void;
  protected subscribeToAccountTokenTransfers(accountAddressOrAddresses: string | readonly string[]): void;
  protected subscribeToAccountTokenTransfers(accountAddressOrAddresses: string | readonly string[]): void {
    this.bridgeComponents.transfersBridgeDataProvider.subscribeToAccountTokenTransfers(accountAddressOrAddresses);
  }

  protected unsubscribeFromAccountTokenTransfers(accountAddress: string): void;
  protected unsubscribeFromAccountTokenTransfers(accountAddresses: readonly string[]): void;
  protected unsubscribeFromAccountTokenTransfers(accountAddressOrAddresses: string | readonly string[]): void;
  protected unsubscribeFromAccountTokenTransfers(accountAddressOrAddresses: string | readonly string[]): void {
    this.bridgeComponents.transfersBridgeDataProvider.unsubscribeFromAccountTokenTransfers(accountAddressOrAddresses);
  }

  protected subscribeToOperationTokenTransfers(transfer: BridgeTokenTransfer): void;
  protected subscribeToOperationTokenTransfers(operationHash: BridgeTokenTransfer): void;
  protected subscribeToOperationTokenTransfers(operationHashOrTokenTransfer: string | BridgeTokenTransfer): void;
  protected subscribeToOperationTokenTransfers(operationHashOrTokenTransfer: string | BridgeTokenTransfer): void {
    this.bridgeComponents.transfersBridgeDataProvider.subscribeToOperationTokenTransfers(operationHashOrTokenTransfer);
  }

  protected unsubscribeFromOperationTokenTransfers(transfer: BridgeTokenTransfer): void;
  protected unsubscribeFromOperationTokenTransfers(operationHash: BridgeTokenTransfer): void;
  protected unsubscribeFromOperationTokenTransfers(operationHashOrTokenTransfer: string | BridgeTokenTransfer): void;
  protected unsubscribeFromOperationTokenTransfers(operationHashOrTokenTransfer: string | BridgeTokenTransfer): void;
  protected unsubscribeFromOperationTokenTransfers(operationHashOrTokenTransfer: string | BridgeTokenTransfer): void {
    this.bridgeComponents.transfersBridgeDataProvider.unsubscribeFromOperationTokenTransfers(operationHashOrTokenTransfer);
  }

  protected unsubscribeFromAllSubscriptions(): void {
    this.bridgeComponents.transfersBridgeDataProvider.unsubscribeFromAllSubscriptions();
  }

  // #endregion

  protected emitLocalTokenTransferCreatedEvent(tokenTransfer: BridgeTokenTransfer) {
    setTimeout(() => {
      this.emitTokenTransferCreatedOrUpdatedEvent(tokenTransfer);
    }, 0);
  }

  protected emitTokenTransferCreatedOrUpdatedEvent(tokenTransfer: BridgeTokenTransfer) {
    this.ensureLastCreatedTokenTransfersTimerIsStarted();

    const initialOperationHash = bridgeUtils.getInitialOperation(tokenTransfer).hash;
    let eventName: 'tokenTransferCreated' | 'tokenTransferUpdated';
    if (this.lastCreatedTokenTransfers.has(initialOperationHash)) {
      eventName = 'tokenTransferUpdated';
    }
    else {
      eventName = 'tokenTransferCreated';
      this.lastCreatedTokenTransfers.set(initialOperationHash, [tokenTransfer, Date.now()]);
    }

    loggerProvider.logger.log(`Emitting the ${eventName} event...`);
    (this.events[eventName] as ToEventEmitter<typeof this.events[typeof eventName]>).emit(tokenTransfer);
    loggerProvider.logger.log(`The ${eventName} event has been emitted`);
  }

  protected resolveStatusWatcherIfNeeded(tokenTransfer: BridgeTokenTransfer) {
    let statusWatcherKey: string;
    let statusWatchers: ReturnType<typeof this.tokenTransferStatusWatchers.get>;

    if (tokenTransfer.status !== BridgeTokenTransferStatus.Pending) {
      statusWatcherKey = tokenTransfer.id;
      statusWatchers = this.tokenTransferStatusWatchers.get(tokenTransfer.id);
    }

    if (!statusWatchers) {
      statusWatcherKey = bridgeUtils.getInitialOperation(tokenTransfer).hash;
      statusWatchers = this.tokenTransferStatusWatchers.get(statusWatcherKey);

      if (!statusWatchers)
        return;
    }

    for (const [status, watcher] of statusWatchers) {
      if (tokenTransfer.status >= status) {
        if (tokenTransfer.status === BridgeTokenTransferStatus.Failed)
          watcher.reject(new FailedTokenTransferError(tokenTransfer));
        else
          watcher.resolve(tokenTransfer);
        statusWatchers.delete(status);
      }
    }

    if (!statusWatchers.size)
      this.tokenTransferStatusWatchers.delete(statusWatcherKey!);
  }

  protected rejectAndClearAllStatusWatchers(error: unknown) {
    for (const statusWatchers of this.tokenTransferStatusWatchers.values()) {
      for (const statusWatcher of statusWatchers.values()) {
        statusWatcher.reject(error);
      }

      statusWatchers.clear();
    }

    this.tokenTransferStatusWatchers.clear();
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
    this.resolveStatusWatcherIfNeeded(createdTokenTransfer);
    this.emitTokenTransferCreatedOrUpdatedEvent(createdTokenTransfer);
  };

  protected handleTransfersBridgeDataProviderTokenTransferUpdated = (updatedTokenTransfer: BridgeTokenTransfer) => {
    this.resolveStatusWatcherIfNeeded(updatedTokenTransfer);
    (this.events.tokenTransferUpdated as ToEventEmitter<typeof this.events.tokenTransferUpdated>).emit(updatedTokenTransfer);
  };

  protected ensureIsNotDisposed() {
    if (!this._isDisposed)
      return;

    loggerProvider.logger.error('Attempting to call the disposed TokenBridge instance');
    throw new TokenBridgeDisposed();
  }

  private ensureLastCreatedTokenTransfersTimerIsStarted() {
    if (this.lastCreatedTokenTransfersTimerId)
      return;

    this.lastCreatedTokenTransfersTimerId = setInterval(
      () => {
        const currentTime = Date.now();
        for (const entry of this.lastCreatedTokenTransfers) {
          if (currentTime - entry[1][1] > TokenBridge.defaultLastCreatedTokenTransferLifetime) {
            this.lastCreatedTokenTransfers.delete(entry[0]);
          }
        }
      },
      TokenBridge.defaultLastCreatedTokenTransfersTimerPeriod
    );
  }

  private async getRequiredTezosSignerAddress(): Promise<string> {
    const tezosSignerAddress = await this.getTezosSignerAddress();
    if (tezosSignerAddress)
      return tezosSignerAddress;

    throw new TezosSignerAccountUnavailableError();
  }

  private async getRequiredEtherlinkSignerAddress(): Promise<string> {
    const tezosSignerAddress = await this.getEtherlinkSignerAddress();
    if (tezosSignerAddress)
      return tezosSignerAddress;

    throw new EtherlinkSignerAccountUnavailableError();
  }
}
