import { DipDupGraphQLQueryBuilder } from './dipDupGraphQLQueryBuilder';
import type { GraphQLResponse, TokenTransferDto } from './dtos';
import * as mappers from './mappers';
import { DipDupWebSocketClient, type DipDupWebSocketResponseDto } from './webSocket';
import { BridgeTokenTransferKind, type BridgeTokenTransfer } from '../../bridge';
import { EventEmitter, RemoteService, ToEventEmitter, type TokenBridgeService } from '../../common';
import type { EtherlinkToken } from '../../etherlink';
import type { TezosToken } from '../../tezos';
import { bridgeUtils } from '../../utils';
import type { BalancesBridgeDataProvider, AccountTokenBalanceInfo } from '../balancesBridgeDataProvider';
import type { TransfersBridgeDataProvider } from '../transfersBridgeDataProvider';

export interface DipDupBridgeDataProviderOptions {
  baseUrl: string;
  autoUpdate: {
    type: 'websocket'
    webSocketApiBaseUrl: string;
  } | false;
}

export class DipDupBridgeDataProvider extends RemoteService implements TransfersBridgeDataProvider, BalancesBridgeDataProvider, TokenBridgeService, Disposable {
  protected static readonly defaultLoadDataLimit = 100;

  readonly events: TransfersBridgeDataProvider['events'] = {
    tokenTransferCreated: new EventEmitter(),
    tokenTransferUpdated: new EventEmitter()
  };

  protected readonly dipDupGraphQLQueryBuilder: DipDupGraphQLQueryBuilder;
  protected readonly dipDupWebSocketClient: DipDupWebSocketClient | null;

  private _isStarted = false;
  private _isStarting = false;

  constructor(options: DipDupBridgeDataProviderOptions) {
    super(options.baseUrl);
    this.dipDupWebSocketClient = options.autoUpdate
      ? new DipDupWebSocketClient(options.autoUpdate.webSocketApiBaseUrl)
      : null;
    this.dipDupGraphQLQueryBuilder = this.createDipDupGraphQLQueryBuilder();
  }

  get isStarted() {
    return this._isStarted;
  }

  async start() {
    if (this.isStarted || this._isStarting)
      return;

    this._isStarting = true;

    try {
      if (this.dipDupWebSocketClient) {
        this.dipDupWebSocketClient.events.messageReceived.addListener(this.onSocketMessageReceived);
        await this.dipDupWebSocketClient.start();
      }

      this._isStarted = true;
    }
    catch (error: unknown) {
      this._isStarting = false;
      this._isStarted = false;

      throw new Error(undefined, { cause: error });
    }
  }

  stop(): void {
    if (!this.isStarted)
      return;

    if (this.dipDupWebSocketClient) {
      this.dipDupWebSocketClient.events.messageReceived.removeListener(this.onSocketMessageReceived);
      this.dipDupWebSocketClient.stop();
    }

    this._isStarted = false;
  }

  async getTokenTransfer(operationHash: string): Promise<BridgeTokenTransfer | null>;
  async getTokenTransfer(tokenTransfer: BridgeTokenTransfer): Promise<BridgeTokenTransfer | null>;
  async getTokenTransfer(_operationHashOrTokenTransfer: string | BridgeTokenTransfer): Promise<BridgeTokenTransfer | null> {
    const operationHash = typeof _operationHashOrTokenTransfer === 'string'
      ? _operationHashOrTokenTransfer
      : (_operationHashOrTokenTransfer.kind === BridgeTokenTransferKind.Deposit)
        ? _operationHashOrTokenTransfer.tezosOperation.hash
        : _operationHashOrTokenTransfer.etherlinkOperation.hash;

    const tokenTransferDtos = await this.fetch<GraphQLResponse<TokenTransferDto>>('/v1/graphql', 'json', {
      method: 'POST',
      body: JSON.stringify({
        query: this.dipDupGraphQLQueryBuilder.getTokenTransferQuery(operationHash)
      })
    });
    if (tokenTransferDtos.errors)
      throw new Error(`Indexer error: ${tokenTransferDtos.errors.join('\n')}`);

    const tokenTransfer = (
      (tokenTransferDtos.data.bridge_deposit[0]
        && mappers.mapBridgeDepositDtoToDepositBridgeTokenTransfer(tokenTransferDtos.data.bridge_deposit[0]))
      || (tokenTransferDtos.data.bridge_withdrawal[0]
        && mappers.mapBridgeWithdrawalDtoToWithdrawalBridgeTokenTransfer(tokenTransferDtos.data.bridge_withdrawal[0]))
    );

    return tokenTransfer || null;
  }

  async getTokenTransfers(): Promise<BridgeTokenTransfer[]>;
  async getTokenTransfers(offset: number, limit: number): Promise<BridgeTokenTransfer[]>;
  async getTokenTransfers(accountAddress: string): Promise<BridgeTokenTransfer[]>;
  async getTokenTransfers(accountAddresses: readonly string[]): Promise<BridgeTokenTransfer[]>;
  async getTokenTransfers(accountAddress: string, offset: number, limit: number): Promise<BridgeTokenTransfer[]>;
  async getTokenTransfers(accountAddresses: readonly string[], offset: number, limit: number): Promise<BridgeTokenTransfer[]>;
  async getTokenTransfers(
    offsetOrAccountAddressOfAddresses?: number | string | readonly string[],
    _offsetOrLimit?: number,
    limitParameter?: number
  ): Promise<BridgeTokenTransfer[]> {
    let accountAddresses: string | readonly string[] | undefined;
    let offset: number | undefined;
    let limit: number | undefined;

    if (offsetOrAccountAddressOfAddresses !== undefined) {
      if (typeof offsetOrAccountAddressOfAddresses === 'number') {
        offset = offsetOrAccountAddressOfAddresses;
        limit = _offsetOrLimit;
      }
      else {
        accountAddresses = offsetOrAccountAddressOfAddresses;
        offset = _offsetOrLimit;
        limit = limitParameter;
      }
    }

    offset = offset && offset > 0 ? offset : 0;
    limit = limit && limit > 0 ? limit : DipDupBridgeDataProvider.defaultLoadDataLimit;

    const tokenTransferDtos = await this.fetch<GraphQLResponse<TokenTransferDto>>('/v1/graphql', 'json', {
      method: 'POST',
      body: JSON.stringify({
        query: this.dipDupGraphQLQueryBuilder.getTokenTransfersQuery(accountAddresses, offset, limit)
      })
    });
    if (tokenTransferDtos.errors)
      throw new Error(`Indexer error: ${tokenTransferDtos.errors.join('\n')}`);

    const tokenTransfers: BridgeTokenTransfer[] = [];

    for (const bridgeDepositDto of tokenTransferDtos.data.bridge_deposit)
      tokenTransfers.push(mappers.mapBridgeDepositDtoToDepositBridgeTokenTransfer(bridgeDepositDto));
    for (const bridgeWithdrawalDto of tokenTransferDtos.data.bridge_withdrawal)
      tokenTransfers.push(mappers.mapBridgeWithdrawalDtoToWithdrawalBridgeTokenTransfer(bridgeWithdrawalDto));

    tokenTransfers.sort((tokenTransferA, tokenTransferB) => {
      const initialTimestampA = tokenTransferA.kind === BridgeTokenTransferKind.Deposit
        ? tokenTransferA.tezosOperation.timestamp
        : tokenTransferA.etherlinkOperation.timestamp;
      const initialTimestampB = tokenTransferB.kind === BridgeTokenTransferKind.Deposit
        ? tokenTransferB.tezosOperation.timestamp
        : tokenTransferB.etherlinkOperation.timestamp;

      return initialTimestampA.localeCompare(initialTimestampB);
    });
    tokenTransfers.slice(offset, offset + limit);

    return tokenTransfers;
  }

  subscribeToTokenTransfer(operationHash: string): void;
  subscribeToTokenTransfer(tokenTransfer: BridgeTokenTransfer): void;
  subscribeToTokenTransfer(operationHashOrTokenTransfer: string | BridgeTokenTransfer): void;
  subscribeToTokenTransfer(operationHashOrTokenTransfer: string | BridgeTokenTransfer): void {
    if (!this.dipDupWebSocketClient)
      throw new Error('AutoUpdate is disabled');

    const operationHash = typeof operationHashOrTokenTransfer === 'string'
      ? operationHashOrTokenTransfer
      : bridgeUtils.getInitialOperationHash(operationHashOrTokenTransfer);

    const subscriptions = this.dipDupGraphQLQueryBuilder.getTokenTransferSubscriptions(operationHash);
    this.dipDupWebSocketClient.subscribe(subscriptions[0]);
    this.dipDupWebSocketClient.subscribe(subscriptions[1]);
  }

  unsubscribeFromTokenTransfer(operationHash: string): void;
  unsubscribeFromTokenTransfer(tokenTransfer: BridgeTokenTransfer): void;
  unsubscribeFromTokenTransfer(operationHashOrTokenTransfer: string | BridgeTokenTransfer): void;
  unsubscribeFromTokenTransfer(operationHashOrTokenTransfer: string | BridgeTokenTransfer): void {
    if (!this.dipDupWebSocketClient)
      throw new Error('AutoUpdate is disabled');

    const operationHash = typeof operationHashOrTokenTransfer === 'string'
      ? operationHashOrTokenTransfer
      : bridgeUtils.getInitialOperationHash(operationHashOrTokenTransfer);

    const subscriptions = this.dipDupGraphQLQueryBuilder.getTokenTransferSubscriptions(operationHash);
    this.dipDupWebSocketClient.unsubscribe(subscriptions[1]);
    this.dipDupWebSocketClient.unsubscribe(subscriptions[0]);
  }

  subscribeToTokenTransfers(): void;
  subscribeToTokenTransfers(accountAddress: string): void;
  subscribeToTokenTransfers(accountAddresses: readonly string[]): void;
  subscribeToTokenTransfers(accountAddressOrAddresses?: string | readonly string[]): void;
  subscribeToTokenTransfers(_accountAddressOrAddresses?: string | readonly string[]): void {

  }

  unsubscribeFromTokenTransfers(): void;
  unsubscribeFromTokenTransfers(accountAddress: string): void;
  unsubscribeFromTokenTransfers(accountAddresses: readonly string[]): void;
  unsubscribeFromTokenTransfers(accountAddressOrAddresses?: string | readonly string[]): void;
  unsubscribeFromTokenTransfers(_accountAddressOrAddresses?: string | readonly string[]): void {

  }

  unsubscribeFromAllTokenTransfers(): void {

  }

  getBalance(_accountAddress: string, _token: TezosToken | EtherlinkToken): Promise<AccountTokenBalanceInfo> {
    throw new Error('Method not implemented.');
  }

  getBalances(accountAddress: string): Promise<AccountTokenBalanceInfo>;
  getBalances(accountAddress: string, tokens: ReadonlyArray<TezosToken | EtherlinkToken>): Promise<AccountTokenBalanceInfo>;
  getBalances(accountAddress: string, offset: number, limit: number): Promise<AccountTokenBalanceInfo>;
  getBalances(
    _accountAddress: string,
    _tokensOrOffset?: ReadonlyArray<TezosToken | EtherlinkToken> | number,
    _limit?: number
  ): Promise<AccountTokenBalanceInfo> {
    throw new Error('Method not implemented.');
  }

  [Symbol.dispose]() {
    this.stop();
  }

  protected readonly onSocketMessageReceived = (message: DipDupWebSocketResponseDto) => {
    if (message.type !== 'data' || !message.payload.data)
      return;

    const data: any = message.payload.data;
    if (data?.bridge_deposit?.[0]) {
      const tokenTransfer = mappers.mapBridgeDepositDtoToDepositBridgeTokenTransfer(data.bridge_deposit[0]);

      (this.events.tokenTransferUpdated as ToEventEmitter<DipDupBridgeDataProvider['events']['tokenTransferUpdated']>).emit(
        tokenTransfer
      );
    }
    else if (data?.bridge_withdrawal?.[0]) {
      const tokenTransfer = mappers.mapBridgeWithdrawalDtoToWithdrawalBridgeTokenTransfer(data.bridge_withdrawal[0]);

      (this.events.tokenTransferUpdated as ToEventEmitter<DipDupBridgeDataProvider['events']['tokenTransferUpdated']>).emit(
        tokenTransfer
      );
    }
  };

  protected createDipDupGraphQLQueryBuilder(): DipDupGraphQLQueryBuilder {
    return new DipDupGraphQLQueryBuilder();
  }
}
