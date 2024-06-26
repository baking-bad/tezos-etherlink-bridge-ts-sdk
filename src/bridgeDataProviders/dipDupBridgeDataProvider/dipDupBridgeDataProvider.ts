import type { DipDupBridgeDataProviderOptions } from './dipDupBridgeDataProviderOptions';
import { DipDupGraphQLQueryBuilder, type GraphQLTransfersFilter } from './dipDupGraphQLQueryBuilder';
import type { GraphQLResponse, BridgeOperationsDto, TokenBalancesDto } from './dtos';
import { DipDupAutoUpdateIsDisabledError, DipDupGraphQLError, DipDupTokenBalanceNotSupported, DipDupTokenTransferIdInvalid } from './errors';
import * as mappers from './mappers';
import { DipDupWebSocketClient, type DipDupWebSocketResponseDto } from './webSocket';
import { loggerProvider } from '../..';
import { BridgeTokenTransferKind, type BridgeTokenTransfer } from '../../bridgeCore';
import { EventEmitter, RemoteService, ToEventEmitter } from '../../common';
import {
  getErrorLogMessage,
  getBridgeTokenTransferLogMessage,
  getDetailedBridgeTokenTransferLogMessage,
  getTokenLogMessage,
  getBridgeTokenTransferIdLogMessage
} from '../../logging';
import type { NonNativeEtherlinkToken } from '../../tokens';
import { bridgeUtils, guards } from '../../utils';
import type { BalancesBridgeDataProvider, AccountTokenBalance, AccountTokenBalances, BalancesFetchOptions } from '../balancesBridgeDataProvider';
import type { TransfersBridgeDataProvider, TransfersFetchOptions } from '../transfersBridgeDataProvider';

export class DipDupBridgeDataProvider extends RemoteService implements TransfersBridgeDataProvider, BalancesBridgeDataProvider, Disposable {
  protected static readonly defaultLoadDataLimit = 100;

  readonly events: TransfersBridgeDataProvider['events'] = {
    tokenTransferCreated: new EventEmitter(),
    tokenTransferUpdated: new EventEmitter()
  };

  protected readonly dipDupGraphQLQueryBuilder: DipDupGraphQLQueryBuilder;
  protected readonly _dipDupWebSocketClient: DipDupWebSocketClient | null;

  private subscribedAddresses: Set<string | null> = new Set();
  private currentTokenTransfersSubscription: string | undefined;

  constructor(options: DipDupBridgeDataProviderOptions) {
    super(options.baseUrl);
    this.dipDupGraphQLQueryBuilder = this.createDipDupGraphQLQueryBuilder();

    if (options.autoUpdate && options.autoUpdate.type === 'websocket') {
      this._dipDupWebSocketClient = new DipDupWebSocketClient(options.autoUpdate.webSocketApiBaseUrl);
      this._dipDupWebSocketClient.events.messageReceived.addListener(this.onSocketMessageReceived);
      if (options.autoUpdate.startImmediately)
        this.startDipDupWebSocketClientIfNeeded();
    }
    else {
      this._dipDupWebSocketClient = null;
    }
  }

  protected get dipDupWebSocketClient(): DipDupWebSocketClient {
    if (this._dipDupWebSocketClient)
      return this._dipDupWebSocketClient;

    const error = new DipDupAutoUpdateIsDisabledError();
    loggerProvider.logger.error(getErrorLogMessage(error));
    throw error;
  }

  async getTokenTransfer(tokenTransferId: string): Promise<BridgeTokenTransfer | null> {
    loggerProvider.logger.log('Getting token transfer by the token transfer Id:', tokenTransferId);

    const operationData = bridgeUtils.convertTokenTransferIdToOperationData(tokenTransferId);
    if (!operationData)
      throw new DipDupTokenTransferIdInvalid(tokenTransferId);

    const bridgeOperationsResponse = await this.fetch<GraphQLResponse<BridgeOperationsDto>>('/v1/graphql', 'json', {
      method: 'POST',
      body: JSON.stringify({
        query: this.dipDupGraphQLQueryBuilder.getTokenTransferQuery(operationData[0], operationData[1], operationData[2])
      })
    });
    this.ensureNoDipDupGraphQLErrors(bridgeOperationsResponse);

    loggerProvider.logger.log('Token transfer has been received by the token transfer Id:', tokenTransferId);

    const tokenTransfer = mappers.mapBridgeOperationsDtoToBridgeTokenTransfer(bridgeOperationsResponse.data)[0];

    loggerProvider.lazyLogger.log?.(getBridgeTokenTransferLogMessage(tokenTransfer));
    loggerProvider.lazyLogger.debug?.(getDetailedBridgeTokenTransferLogMessage(tokenTransfer));

    return tokenTransfer || null;
  }

  async getTokenTransfers(): Promise<BridgeTokenTransfer[]>;
  async getTokenTransfers(fetchOptions: TransfersFetchOptions): Promise<BridgeTokenTransfer[]>;
  async getTokenTransfers(fetchOptions?: TransfersFetchOptions): Promise<BridgeTokenTransfer[]>;
  async getTokenTransfers(fetchOptions?: TransfersFetchOptions): Promise<BridgeTokenTransfer[]> {
    return this.getTokenTransfersInternal(undefined, fetchOptions);
  }

  async getAccountTokenTransfers(accountAddress: string): Promise<BridgeTokenTransfer[]>;
  async getAccountTokenTransfers(accountAddresses: readonly string[]): Promise<BridgeTokenTransfer[]>;
  async getAccountTokenTransfers(accountAddress: string, fetchOptions: TransfersFetchOptions): Promise<BridgeTokenTransfer[]>;
  async getAccountTokenTransfers(accountAddresses: readonly string[], fetchOptions: TransfersFetchOptions): Promise<BridgeTokenTransfer[]>;
  async getAccountTokenTransfers(accountAddressOrAddresses: string | readonly string[], fetchOptions?: TransfersFetchOptions): Promise<BridgeTokenTransfer[]>;
  async getAccountTokenTransfers(accountAddressOrAddresses: string | readonly string[], fetchOptions?: TransfersFetchOptions): Promise<BridgeTokenTransfer[]> {
    return this.validateAccountAddressOrAddresses(accountAddressOrAddresses)
      ? this.getTokenTransfersInternal(accountAddressOrAddresses, fetchOptions)
      : [];
  }

  async getOperationTokenTransfers(operationHash: string): Promise<BridgeTokenTransfer[]>;
  async getOperationTokenTransfers(tokenTransfer: BridgeTokenTransfer): Promise<BridgeTokenTransfer[]>;
  async getOperationTokenTransfers(operationHashOrTokenTransfer: string | BridgeTokenTransfer): Promise<BridgeTokenTransfer[]>;
  async getOperationTokenTransfers(operationHashOrTokenTransfer: string | BridgeTokenTransfer): Promise<BridgeTokenTransfer[]> {
    const operationHash = typeof operationHashOrTokenTransfer === 'string'
      ? operationHashOrTokenTransfer
      : (operationHashOrTokenTransfer.kind === BridgeTokenTransferKind.Deposit)
        ? operationHashOrTokenTransfer.tezosOperation.hash
        : operationHashOrTokenTransfer.etherlinkOperation.hash;

    loggerProvider.logger.log('Getting token transfer by the operation hash:', operationHash);

    const bridgeOperationsResponse = await this.fetch<GraphQLResponse<BridgeOperationsDto>>('/v1/graphql', 'json', {
      method: 'POST',
      body: JSON.stringify({
        query: this.dipDupGraphQLQueryBuilder.getOperationTokenTransfersQuery(operationHash)
      })
    });
    this.ensureNoDipDupGraphQLErrors(bridgeOperationsResponse);

    loggerProvider.logger.log(`Token transfer (${bridgeOperationsResponse.data.bridge_operation.length}) has been received by the operation hash:`, operationHash);

    const tokenTransfers = mappers.mapBridgeOperationsDtoToBridgeTokenTransfer(bridgeOperationsResponse.data);

    return tokenTransfers;
  }

  subscribeToTokenTransfer(tokenTransferId: string): void {
    this.startDipDupWebSocketClientIfNeeded();

    loggerProvider.logger.log('Subscribe to the token transfer by the token transfer Id:', tokenTransferId);

    const operationData = bridgeUtils.convertTokenTransferIdToOperationData(tokenTransferId);
    if (!operationData)
      throw new DipDupTokenTransferIdInvalid(tokenTransferId);

    const subscription = this.dipDupGraphQLQueryBuilder.getTokenTransferSubscription(operationData[0], operationData[1], operationData[2]);
    this.dipDupWebSocketClient.subscribe(subscription);
  }

  unsubscribeFromTokenTransfer(tokenTransferId: string): void {
    loggerProvider.logger.log('Unsubscribe from the token transfer by the token transfer Id:', tokenTransferId);

    const operationData = bridgeUtils.convertTokenTransferIdToOperationData(tokenTransferId);
    if (!operationData)
      throw new DipDupTokenTransferIdInvalid(tokenTransferId);

    const subscription = this.dipDupGraphQLQueryBuilder.getTokenTransferSubscription(operationData[0], operationData[1], operationData[2]);
    this.dipDupWebSocketClient.unsubscribe(subscription);
  }

  subscribeToTokenTransfers(): void {
    this.startDipDupWebSocketClientIfNeeded();
    this.subscribeToTokenTransfersInternal(null);
  }

  unsubscribeFromTokenTransfers(): void {
    this.unsubscribeFromTokenTransfersInternal(null);
  }

  subscribeToAccountTokenTransfers(accountAddress: string): void;
  subscribeToAccountTokenTransfers(accountAddresses: readonly string[]): void;
  subscribeToAccountTokenTransfers(accountAddressOrAddresses: string | readonly string[]): void;
  subscribeToAccountTokenTransfers(accountAddressOrAddresses: string | readonly string[]): void {
    if (!this.validateAccountAddressOrAddresses(accountAddressOrAddresses))
      return;

    this.startDipDupWebSocketClientIfNeeded();
    this.subscribeToTokenTransfersInternal(accountAddressOrAddresses);
  }

  unsubscribeFromAccountTokenTransfers(accountAddress: string): void;
  unsubscribeFromAccountTokenTransfers(accountAddresses: readonly string[]): void;
  unsubscribeFromAccountTokenTransfers(accountAddressOrAddresses: string | readonly string[]): void;
  unsubscribeFromAccountTokenTransfers(accountAddressOrAddresses: string | readonly string[]): void {
    if (!this.validateAccountAddressOrAddresses(accountAddressOrAddresses))
      return;

    this.unsubscribeFromTokenTransfersInternal(accountAddressOrAddresses);
  }

  subscribeToOperationTokenTransfers(operationHash: string): void;
  subscribeToOperationTokenTransfers(tokenTransfer: BridgeTokenTransfer): void;
  subscribeToOperationTokenTransfers(operationHashOrTokenTransfer: string | BridgeTokenTransfer): void;
  subscribeToOperationTokenTransfers(operationHashOrTokenTransfer: string | BridgeTokenTransfer): void {
    this.startDipDupWebSocketClientIfNeeded();
    const operationHash = typeof operationHashOrTokenTransfer === 'string'
      ? operationHashOrTokenTransfer
      : bridgeUtils.getInitialOperation(operationHashOrTokenTransfer).hash;

    loggerProvider.logger.log('Subscribe to the token transfers by the initial operation:', operationHash);

    const subscription = this.dipDupGraphQLQueryBuilder.getOperationTokenTransfersSubscription(operationHash);
    this.dipDupWebSocketClient.subscribe(subscription);
  }

  unsubscribeFromOperationTokenTransfers(operationHash: string): void;
  unsubscribeFromOperationTokenTransfers(tokenTransfer: BridgeTokenTransfer): void;
  unsubscribeFromOperationTokenTransfers(operationHashOrTokenTransfer: string | BridgeTokenTransfer): void;
  unsubscribeFromOperationTokenTransfers(operationHashOrTokenTransfer: string | BridgeTokenTransfer): void {
    const operationHash = typeof operationHashOrTokenTransfer === 'string'
      ? operationHashOrTokenTransfer
      : bridgeUtils.getInitialOperation(operationHashOrTokenTransfer).hash;

    loggerProvider.logger.log('Unsubscribe from the token transfers by the initial operation:', operationHash);

    const subscription = this.dipDupGraphQLQueryBuilder.getOperationTokenTransfersSubscription(operationHash);
    this.dipDupWebSocketClient.unsubscribe(subscription);
  }

  unsubscribeFromAllSubscriptions(): void {
    this.dipDupWebSocketClient.unsubscribeFromAllSubscriptions();
    this.subscribedAddresses.clear();
    this.currentTokenTransfersSubscription = undefined;
  }

  async getBalance(accountAddress: string, token: NonNativeEtherlinkToken): Promise<AccountTokenBalance> {
    if (token.type !== 'erc20') {
      const error = new DipDupTokenBalanceNotSupported(token);
      loggerProvider.logger.error(error);
      throw error;
    }

    loggerProvider.lazyLogger.log?.(`Getting balance of the ${getTokenLogMessage(token)} token for the ${accountAddress} address`);

    const tokenBalanceResponse = await this.fetch<GraphQLResponse<TokenBalancesDto>>('/v1/graphql', 'json', {
      method: 'POST',
      body: JSON.stringify({
        query: this.dipDupGraphQLQueryBuilder.getTokenBalanceQuery(accountAddress, token.address)
      })
    });
    this.ensureNoDipDupGraphQLErrors(tokenBalanceResponse);

    loggerProvider.lazyLogger.log?.(`The balance of the ${getTokenLogMessage(token)} token for the ${accountAddress} address has been received`);
    loggerProvider.logger.debug('Mapping the tokenBalancesDTO to AccountTokenBalances...');

    const accountTokenBalance = mappers.mapTokenBalancesDtoToAccountTokenBalance(tokenBalanceResponse.data);

    loggerProvider.logger.debug('Mapping has been completed.');
    loggerProvider.lazyLogger.log?.(`The balance of the ${getTokenLogMessage(token)} token for the ${accountAddress} address is ${accountTokenBalance?.balance}`);

    return accountTokenBalance || {
      address: accountAddress,
      token,
      balance: 0n
    } satisfies AccountTokenBalance;
  }

  async getBalances(accountAddress: string): Promise<AccountTokenBalances>;
  async getBalances(accountAddress: string, tokens: readonly NonNativeEtherlinkToken[]): Promise<AccountTokenBalances>;
  async getBalances(accountAddress: string, fetchOptions: BalancesFetchOptions): Promise<AccountTokenBalances>;
  async getBalances(accountAddress: string, tokensOrFetchOptions?: readonly NonNativeEtherlinkToken[] | BalancesFetchOptions): Promise<AccountTokenBalances>;
  async getBalances(accountAddress: string, tokensOrFetchOptions?: readonly NonNativeEtherlinkToken[] | BalancesFetchOptions): Promise<AccountTokenBalances> {
    let query: string;
    const isAllTokens = !guards.isReadonlyArray(tokensOrFetchOptions);

    if (isAllTokens) {
      query = this.dipDupGraphQLQueryBuilder.getAllTokenBalancesQuery(
        accountAddress,
        this.getPreparedOffsetParameter(tokensOrFetchOptions),
        this.getPreparedLimitParameter(tokensOrFetchOptions),
      );
    }
    else {
      const tokenAddresses = tokensOrFetchOptions.map(token => token.address);
      query = this.dipDupGraphQLQueryBuilder.getTokenBalancesQuery(
        accountAddress,
        tokenAddresses
      );
    }

    loggerProvider.lazyLogger.log?.(`Getting balances of the ${isAllTokens ? 'all' : getTokenLogMessage(tokensOrFetchOptions)} tokens for the ${accountAddress} address`);

    const tokenBalancesResponse = await this.fetch<GraphQLResponse<TokenBalancesDto>>('/v1/graphql', 'json', {
      method: 'POST',
      body: JSON.stringify({
        query
      })
    });
    this.ensureNoDipDupGraphQLErrors(tokenBalancesResponse);

    loggerProvider.lazyLogger.log?.(`The balances of the ${isAllTokens ? 'all' : getTokenLogMessage(tokensOrFetchOptions)} tokens for the ${accountAddress} address has been received`);
    loggerProvider.logger.debug('Mapping the tokenBalancesDTO to AccountTokenBalances...');

    const accountTokenBalances = mappers.mapTokenBalancesDtoToAccountTokenBalances(tokenBalancesResponse.data, accountAddress);

    loggerProvider.logger.debug('Mapping has been completed.');

    return accountTokenBalances;
  }

  [Symbol.dispose]() {
    this._dipDupWebSocketClient?.events.messageReceived.removeListener(this.onSocketMessageReceived);
    this.stopDipDupWebSocketClient();
  }

  protected startDipDupWebSocketClientIfNeeded() {
    if (!this._dipDupWebSocketClient)
      return;

    this._dipDupWebSocketClient.start()
      .catch(error => loggerProvider.logger.error(`DipDup Web Socket has not bee started. Error = ${getErrorLogMessage(error)}`));
  }

  protected stopDipDupWebSocketClient(): void {
    this._dipDupWebSocketClient?.stop();
  }

  protected async getTokenTransfersInternal(
    addressOrAddresses: string | readonly string[] | undefined | null,
    fetchOptions?: TransfersFetchOptions | undefined | null
  ): Promise<BridgeTokenTransfer[]> {
    const offset = this.getPreparedOffsetParameter(fetchOptions);
    const limit = this.getPreparedLimitParameter(fetchOptions);
    const filter = this.mapTransfersFilterToGraphQLTransfersFilter(fetchOptions?.filter);

    loggerProvider.lazyLogger.log?.(addressOrAddresses
      ? `Getting token transfers for ${typeof addressOrAddresses === 'string'
        ? `${addressOrAddresses} address.`
        : `[${addressOrAddresses.join(', ')}] addresses.`}`
      : 'Getting all token transfers.',
      `Offset == ${offset}; Limit == ${limit}.`,
      `Filter: ${JSON.stringify(filter)}.`
    );

    const bridgeOperationsResponse = await this.fetch<GraphQLResponse<BridgeOperationsDto>>('/v1/graphql', 'json', {
      method: 'POST',
      body: JSON.stringify({
        query: this.dipDupGraphQLQueryBuilder.getTokenTransfersQuery(addressOrAddresses, offset, limit, filter)
      })
    });
    this.ensureNoDipDupGraphQLErrors(bridgeOperationsResponse);

    loggerProvider.lazyLogger.log?.(addressOrAddresses
      ? `Token transfers have been received for ${typeof addressOrAddresses === 'string'
        ? `${addressOrAddresses} address.`
        : `[${addressOrAddresses.join(', ')}] addresses.`}`
      : 'Token transfers have been received.',
      `Offset == ${offset}; Limit == ${limit}.`,
      `Bridge Operations Count == ${bridgeOperationsResponse.data.bridge_operation.length}`
    );
    const tokenTransfers = mappers.mapBridgeOperationsDtoToBridgeTokenTransfer(bridgeOperationsResponse.data);

    return tokenTransfers;
  }

  protected subscribeToTokenTransfersInternal(addressOrAddresses: string | readonly string[] | undefined | null) {
    loggerProvider.lazyLogger.log?.(addressOrAddresses
      ? `Subscribe to token transfers of the ${typeof addressOrAddresses === 'string'
        ? `${addressOrAddresses} address.`
        : `[${addressOrAddresses.join(', ')}] addresses.`}`
      : 'Subscribe to all token transfers.'
    );

    const [currentSubscribedAddressesSize, updatedSubscribedAddressesSize] = this.updateSubscribedAddresses(addressOrAddresses, true);
    if (updatedSubscribedAddressesSize === currentSubscribedAddressesSize || (this.subscribedAddresses.has(null) && addressOrAddresses)) {
      loggerProvider.lazyLogger.log?.(updatedSubscribedAddressesSize === currentSubscribedAddressesSize
        ? (addressOrAddresses
          ? `The token transfers of the requested ${typeof addressOrAddresses === 'string'
            ? `${addressOrAddresses} address has`
            : `[${addressOrAddresses.join(', ')}] addresses have`} already been subscribed.`
          : 'Already subscribed to all token transfers.') + ' Skip the new subscription'
        : `Subscription to all token transfers is active. There's no need to subscribe to token transfers of the ${typeof addressOrAddresses === 'string'
          ? `${addressOrAddresses} address.`
          : `[${addressOrAddresses!.join(', ')}] addresses.`}`);

      return;
    }

    this.resubscribeToTokenTransfers();
  }

  protected unsubscribeFromTokenTransfersInternal(addressOrAddresses: string | readonly string[] | undefined | null) {
    loggerProvider.lazyLogger.log?.(addressOrAddresses
      ? `Unsubscribe from token transfers of the ${typeof addressOrAddresses === 'string'
        ? `${addressOrAddresses} address.`
        : `[${addressOrAddresses.join(', ')}] addresses.`}`
      : 'Unsubscribe from all token transfers.'
    );

    const [currentSubscribedAddressesSize, updatedSubscribedAddressesSize] = this.updateSubscribedAddresses(addressOrAddresses, false);
    if (updatedSubscribedAddressesSize === currentSubscribedAddressesSize || (this.subscribedAddresses.has(null) && addressOrAddresses)) {
      loggerProvider.lazyLogger.log?.(updatedSubscribedAddressesSize === currentSubscribedAddressesSize
        ? (addressOrAddresses
          ? `The token transfers of the requested ${typeof addressOrAddresses === 'string'
            ? `${addressOrAddresses} address has`
            : `[${addressOrAddresses.join(', ')}] addresses have`} already been unsubscribed.`
          : 'Already unsubscribed from all token transfers.') + ' No additional action is required.'
        : `Subscription to all token transfers is active. There's no need to unsubscribe from token transfers of the ${typeof addressOrAddresses === 'string'
          ? `${addressOrAddresses} address.`
          : `[${addressOrAddresses!.join(', ')}] addresses.`}`);

      return;
    }

    this.resubscribeToTokenTransfers();
  }

  protected createDipDupGraphQLQueryBuilder(): DipDupGraphQLQueryBuilder {
    return new DipDupGraphQLQueryBuilder();
  }

  protected mapTransfersFilterToGraphQLTransfersFilter(filter: TransfersFetchOptions['filter']): GraphQLTransfersFilter | null {
    if (!filter || (!filter.kind && !filter.status))
      return null;

    const type = filter.kind
      ? mappers.mapBridgeTokenTransferKindsToBridgeOperationDtoTypes(filter.kind)
      : undefined;
    const status = filter.status
      ? mappers.mapBridgeTokenTransferStatusesToBridgeOperationDtoStatuses(filter.status)
      : undefined;

    return {
      type,
      status
    };
  }

  protected ensureNoDipDupGraphQLErrors<TData>(response: GraphQLResponse<TData>) {
    if (!response.errors || !response.errors.length)
      return;

    const error = new DipDupGraphQLError(response.errors);
    loggerProvider.logger.error(getErrorLogMessage(error));

    throw error;
  }

  protected readonly onSocketMessageReceived = (message: DipDupWebSocketResponseDto) => {
    try {
      if (message.type !== 'data' || !message.payload.data)
        return;

      loggerProvider.logger.debug('DipDup data message was received.', `Message Id == ${message.id}`);

      const data: any = message.payload.data;
      const bridgeOperationDtos = (data && (data.bridge_operation || data.bridge_operation_stream)) as BridgeOperationsDto['bridge_operation'] | undefined;
      if (!bridgeOperationDtos?.length)
        return;

      loggerProvider.logger.log('bridge_operation updated was received. Count of updated records:', bridgeOperationDtos.length);

      for (const bridgeOperationDto of bridgeOperationDtos) {
        const isCreated = this.isBridgeOperationCreated(bridgeOperationDto);
        const tokenTransfer = mappers.mapBridgeOperationDtoToBridgeTokenTransfer(bridgeOperationDto);
        if (!tokenTransfer)
          continue;

        loggerProvider.lazyLogger.log?.(`The ${getBridgeTokenTransferIdLogMessage(tokenTransfer)} token transfer has been ${isCreated ? 'created' : 'updated'}.`);
        loggerProvider.lazyLogger.log?.(getBridgeTokenTransferLogMessage(tokenTransfer));
        loggerProvider.lazyLogger.debug?.(getDetailedBridgeTokenTransferLogMessage(tokenTransfer));

        (this.events[isCreated ? 'tokenTransferCreated' : 'tokenTransferUpdated'] as ToEventEmitter<DipDupBridgeDataProvider['events']['tokenTransferUpdated']>).emit(
          tokenTransfer
        );
      }
    } catch (error: unknown) {
      loggerProvider.logger.error('Unknown error in the socket message handler.', getErrorLogMessage(error));
    }
  };

  private resubscribeToTokenTransfers() {
    let newSubscription: string | undefined;

    if (this.subscribedAddresses.size) {
      loggerProvider.logger.debug('Resubscribe to the token transfers subscription');
      newSubscription = this.dipDupGraphQLQueryBuilder.getTokenTransfersStreamSubscription(
        this.subscribedAddresses.has(null) ? null : ([...this.subscribedAddresses] as readonly string[]),
        new Date()
      );
      this.dipDupWebSocketClient.subscribe(newSubscription);
    }

    if (this.currentTokenTransfersSubscription) {
      loggerProvider.logger.debug('Unsubscribe from the previous token transfers subscription');
      this.dipDupWebSocketClient.unsubscribe(this.currentTokenTransfersSubscription);
    }

    this.currentTokenTransfersSubscription = newSubscription;
  }

  private updateSubscribedAddresses(
    addressOrAddresses: string | readonly string[] | undefined | null,
    isAdd: boolean
  ): readonly [previousSubscribedAddressesSize: number, updatedSubscribedAddressesSize: number] {
    const previousSubscribedAddressesSize = this.subscribedAddresses.size;
    const method = isAdd ? 'add' : 'delete';

    loggerProvider.logger.debug('Current count of the subscribed addresses (include all [null]): ', previousSubscribedAddressesSize);

    if (addressOrAddresses) {
      if (typeof addressOrAddresses === 'string') {
        this.subscribedAddresses[method](addressOrAddresses);
      } else {
        for (const address of addressOrAddresses)
          this.subscribedAddresses[method](address);
      }
    } else {
      this.subscribedAddresses[method](null);
    }
    const updatedSubscribedAddressesSize = this.subscribedAddresses.size;
    loggerProvider.logger.debug('Updated count of the subscribed addresses (include all [null]): ', updatedSubscribedAddressesSize);

    return [previousSubscribedAddressesSize, updatedSubscribedAddressesSize];
  }

  private validateAccountAddressOrAddresses(accountAddressOrAddresses: unknown): accountAddressOrAddresses is string | readonly string[] {
    return !!((guards.isReadonlyArray(accountAddressOrAddresses) && accountAddressOrAddresses.length)
      || (typeof accountAddressOrAddresses === 'string' && accountAddressOrAddresses));
  }

  private getPreparedOffsetParameter(offsetOrFetchOptions: number | undefined | null | BalancesFetchOptions): number {
    const offset = typeof offsetOrFetchOptions === 'number' ? offsetOrFetchOptions : offsetOrFetchOptions?.offset;

    return offset && offset > 0 ? offset : 0;
  }

  private getPreparedLimitParameter(limitOrFetchOptions: number | undefined | null | BalancesFetchOptions): number {
    const limit = typeof limitOrFetchOptions === 'number' ? limitOrFetchOptions : limitOrFetchOptions?.limit;

    return limit && limit > 0 ? limit : DipDupBridgeDataProvider.defaultLoadDataLimit;
  }

  private isBridgeOperationCreated(bridgeOperationDto: BridgeOperationsDto['bridge_operation'][0]): boolean {
    return !bridgeOperationDto.is_completed
      && (new Date(bridgeOperationDto.updated_at).valueOf() - new Date(bridgeOperationDto.created_at).valueOf() <= 3000);
  }
}
