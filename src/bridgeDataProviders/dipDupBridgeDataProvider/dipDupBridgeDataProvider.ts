import type { DipDupBridgeDataProviderOptions } from './dipDupBridgeDataProviderOptions';
import { DipDupGraphQLQueryBuilder } from './dipDupGraphQLQueryBuilder';
import type { GraphQLResponse, BridgeOperationsDto, TokenBalancesDto } from './dtos';
import { DipDupAutoUpdateIsDisabledError, DipDupGraphQLError, DipDupTokenBalanceNotSupported } from './errors';
import * as mappers from './mappers';
import { DipDupWebSocketClient, type DipDupWebSocketResponseDto } from './webSocket';
import { loggerProvider } from '../..';
import { BridgeTokenTransferKind, type BridgeTokenTransfer } from '../../bridgeCore';
import { EventEmitter, RemoteService, ToEventEmitter } from '../../common';
import type { NonNativeEtherlinkToken } from '../../etherlink';
import {
  getErrorLogMessage,
  getBridgeTokenTransferLogMessage,
  getDetailedBridgeTokenTransferLogMessage,
  getTokenLogMessage
} from '../../logging';
import { bridgeUtils } from '../../utils';
import type { BalancesBridgeDataProvider, AccountTokenBalance, AccountTokenBalances } from '../balancesBridgeDataProvider';
import type { TransfersBridgeDataProvider } from '../transfersBridgeDataProvider';

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

  async getTokenTransfer(operationHash: string): Promise<BridgeTokenTransfer | null>;
  async getTokenTransfer(tokenTransfer: BridgeTokenTransfer): Promise<BridgeTokenTransfer | null>;
  async getTokenTransfer(operationHashOrTokenTransfer: string | BridgeTokenTransfer): Promise<BridgeTokenTransfer | null>;
  async getTokenTransfer(operationHashOrTokenTransfer: string | BridgeTokenTransfer): Promise<BridgeTokenTransfer | null> {
    const operationHash = typeof operationHashOrTokenTransfer === 'string'
      ? operationHashOrTokenTransfer
      : (operationHashOrTokenTransfer.kind === BridgeTokenTransferKind.Deposit)
        ? operationHashOrTokenTransfer.tezosOperation.hash
        : operationHashOrTokenTransfer.etherlinkOperation.hash;

    loggerProvider.logger.log('Getting token transfer by the operation hash:', operationHash);

    const bridgeOperationsResponse = await this.fetch<GraphQLResponse<BridgeOperationsDto>>('/v1/graphql', 'json', {
      method: 'POST',
      body: JSON.stringify({
        query: this.dipDupGraphQLQueryBuilder.getTokenTransferQuery(operationHash)
      })
    });
    this.ensureNoDipDupGraphQLErrors(bridgeOperationsResponse);

    loggerProvider.logger.log('Token transfer has been received by the operation hash:', operationHash);

    const tokenTransfer = mappers.mapBridgeOperationsDtoToBridgeTokenTransfer(bridgeOperationsResponse.data)[0];

    loggerProvider.lazyLogger.log?.(getBridgeTokenTransferLogMessage(tokenTransfer));
    loggerProvider.lazyLogger.debug?.(getDetailedBridgeTokenTransferLogMessage(tokenTransfer));

    return tokenTransfer || null;
  }

  async getTokenTransfers(): Promise<BridgeTokenTransfer[]>;
  async getTokenTransfers(offset: number, limit: number): Promise<BridgeTokenTransfer[]>;
  async getTokenTransfers(offset?: number, limit?: number): Promise<BridgeTokenTransfer[]>;
  async getTokenTransfers(offset?: number, limit?: number): Promise<BridgeTokenTransfer[]> {
    return this.getTokenTransfersInternal(undefined, offset, limit);
  }

  async getAccountTokenTransfers(accountAddress: string): Promise<BridgeTokenTransfer[]>;
  async getAccountTokenTransfers(accountAddresses: readonly string[]): Promise<BridgeTokenTransfer[]>;
  async getAccountTokenTransfers(accountAddress: string, offset: number, limit: number): Promise<BridgeTokenTransfer[]>;
  async getAccountTokenTransfers(accountAddresses: readonly string[], offset: number, limit: number): Promise<BridgeTokenTransfer[]>;
  async getAccountTokenTransfers(accountAddressOfAddresses: string | readonly string[], offset?: number, limit?: number): Promise<BridgeTokenTransfer[]>;
  async getAccountTokenTransfers(
    accountAddressOfAddresses: string | readonly string[],
    offset?: number,
    limit?: number
  ): Promise<BridgeTokenTransfer[]> {
    return this.getTokenTransfersInternal(accountAddressOfAddresses, offset, limit);
  }

  subscribeToTokenTransfer(operationHash: string): void;
  subscribeToTokenTransfer(tokenTransfer: BridgeTokenTransfer): void;
  subscribeToTokenTransfer(operationHashOrTokenTransfer: string | BridgeTokenTransfer): void;
  subscribeToTokenTransfer(operationHashOrTokenTransfer: string | BridgeTokenTransfer): void {
    this.startDipDupWebSocketClientIfNeeded();
    const operationHash = typeof operationHashOrTokenTransfer === 'string'
      ? operationHashOrTokenTransfer
      : bridgeUtils.getInitialOperationHash(operationHashOrTokenTransfer);

    loggerProvider.logger.log('Subscribe to the token transfer by the initial operation:', operationHash);

    const subscription = this.dipDupGraphQLQueryBuilder.getTokenTransferSubscription(operationHash);
    this.dipDupWebSocketClient.subscribe(subscription);
  }

  unsubscribeFromTokenTransfer(operationHash: string): void;
  unsubscribeFromTokenTransfer(tokenTransfer: BridgeTokenTransfer): void;
  unsubscribeFromTokenTransfer(operationHashOrTokenTransfer: string | BridgeTokenTransfer): void;
  unsubscribeFromTokenTransfer(operationHashOrTokenTransfer: string | BridgeTokenTransfer): void {
    const operationHash = typeof operationHashOrTokenTransfer === 'string'
      ? operationHashOrTokenTransfer
      : bridgeUtils.getInitialOperationHash(operationHashOrTokenTransfer);

    loggerProvider.logger.log('Unsubscribe from the token transfer by the initial operation:', operationHash);

    const subscription = this.dipDupGraphQLQueryBuilder.getTokenTransferSubscription(operationHash);
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
  subscribeToAccountTokenTransfers(accountAddressOrAddresses?: string | readonly string[]): void;
  subscribeToAccountTokenTransfers(accountAddressOrAddresses?: string | readonly string[]): void {
    this.startDipDupWebSocketClientIfNeeded();
    this.subscribeToTokenTransfersInternal(accountAddressOrAddresses);
  }

  unsubscribeFromAccountTokenTransfers(): void;
  unsubscribeFromAccountTokenTransfers(accountAddress: string): void;
  unsubscribeFromAccountTokenTransfers(accountAddresses: readonly string[]): void;
  unsubscribeFromAccountTokenTransfers(accountAddressOrAddresses?: string | readonly string[]): void;
  unsubscribeFromAccountTokenTransfers(accountAddressOrAddresses?: string | readonly string[]): void {
    this.unsubscribeFromTokenTransfersInternal(accountAddressOrAddresses);
  }

  unsubscribeFromAllSubscriptions(): void {
    this.dipDupWebSocketClient.unsubscribeFromAllSubscriptions();
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
  async getBalances(accountAddress: string, offset: number, limit: number): Promise<AccountTokenBalances>;
  async getBalances(accountAddress: string, tokensOrOffset?: readonly NonNativeEtherlinkToken[] | number, limit?: number): Promise<AccountTokenBalances>;
  async getBalances(
    accountAddress: string,
    tokensOrOffset?: readonly NonNativeEtherlinkToken[] | number,
    limit?: number
  ): Promise<AccountTokenBalances> {
    let query: string;
    const isAllTokens = typeof tokensOrOffset === 'number' || !tokensOrOffset;

    if (isAllTokens) {
      query = this.dipDupGraphQLQueryBuilder.getAllTokenBalancesQuery(
        accountAddress,
        this.getPreparedOffsetParameter(tokensOrOffset),
        this.getPreparedLimitParameter(limit),
      );
    }
    else {
      const tokenAddresses = tokensOrOffset.map(token => token.address);
      query = this.dipDupGraphQLQueryBuilder.getTokenBalancesQuery(
        accountAddress,
        tokenAddresses
      );
    }

    loggerProvider.lazyLogger.log?.(`Getting balances of the ${isAllTokens ? 'all' : getTokenLogMessage(tokensOrOffset)} tokens for the ${accountAddress} address`);

    const tokenBalancesResponse = await this.fetch<GraphQLResponse<TokenBalancesDto>>('/v1/graphql', 'json', {
      method: 'POST',
      body: JSON.stringify({
        query
      })
    });
    this.ensureNoDipDupGraphQLErrors(tokenBalancesResponse);

    loggerProvider.lazyLogger.log?.(`The balances of the ${isAllTokens ? 'all' : getTokenLogMessage(tokensOrOffset)} tokens for the ${accountAddress} address has been received`);
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
    offset: number | undefined | null,
    limit: number | undefined | null
  ): Promise<BridgeTokenTransfer[]> {

    offset = this.getPreparedOffsetParameter(offset);
    limit = this.getPreparedLimitParameter(limit);

    loggerProvider.lazyLogger.log?.(addressOrAddresses
      ? `Getting token transfers for ${typeof addressOrAddresses === 'string'
        ? `${addressOrAddresses} address.`
        : `[${addressOrAddresses.join(', ')}] addresses.`}`
      : 'Getting all token transfers.',
      `Offset == ${offset}; Limit == ${limit}`
    );

    const bridgeOperationsResponse = await this.fetch<GraphQLResponse<BridgeOperationsDto>>('/v1/graphql', 'json', {
      method: 'POST',
      body: JSON.stringify({
        query: this.dipDupGraphQLQueryBuilder.getTokenTransfersQuery(addressOrAddresses, offset, limit)
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

        loggerProvider.lazyLogger.log?.(`The ${bridgeUtils.getInitialOperationHash(tokenTransfer)} token transfer has been ${isCreated ? 'created' : 'updated'}.`);
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

  private getPreparedOffsetParameter(offset: number | undefined | null): number {
    return offset && offset > 0 ? offset : 0;
  }

  private getPreparedLimitParameter(limit: number | undefined | null): number {
    return limit && limit > 0 ? limit : DipDupBridgeDataProvider.defaultLoadDataLimit;
  }

  private isBridgeOperationCreated(bridgeOperationDto: BridgeOperationsDto['bridge_operation'][0]): boolean {
    return !bridgeOperationDto.is_completed
      && (new Date(bridgeOperationDto.updated_at).valueOf() - new Date(bridgeOperationDto.created_at).valueOf() <= 3000);
  }
}
