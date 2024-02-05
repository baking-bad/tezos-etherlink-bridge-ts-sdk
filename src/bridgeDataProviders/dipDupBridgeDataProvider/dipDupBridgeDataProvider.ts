import type { GraphQLResponse, TokenTransferDto } from './dtos';
import * as mappers from './mappers';
import { DipDupWebSocketClient, type DipDupWebSocketResponseDto } from './webSocket';
import { BridgeTokenTransferKind, type BridgeTokenTransfer, BridgeTokenTransferStatus } from '../../bridge';
import { EventEmitter, RemoteService, ToEventEmitter, type TokenBridgeService } from '../../common';
import type { EtherlinkToken } from '../../etherlink';
import type { TezosToken } from '../../tezos';
import { etherlinkUtils } from '../../utils';
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
  protected static readonly bridgeDepositGraphQLFields = `
  l1_transaction {
    amount
    counter
    initiator
    l1_account
    l2_account
    level
    nonce
    operation_hash
    sender
    target
    timestamp
    ticket {
      token {
        contract_address
        token_id
        decimals
      }
    }
    inbox_message {
      index
      level
    }
  }
  l2_transaction {
    address
    amount
    l2_account
    level
    log_index
    timestamp
    transaction_hash
  }`;

  readonly events: TransfersBridgeDataProvider['events'] = {
    accountTokenTransferCreated: new EventEmitter(),
    accountTokenTransferUpdated: new EventEmitter(),
    tokenTransferCreated: new EventEmitter(),
    tokenTransferUpdated: new EventEmitter()
  };

  protected readonly dipDupWebSocketClient: DipDupWebSocketClient | null;

  private _isStarted = false;
  private _isStarting = false;

  constructor(options: DipDupBridgeDataProviderOptions) {
    super(options.baseUrl);
    this.dipDupWebSocketClient = options.autoUpdate
      ? new DipDupWebSocketClient(options.autoUpdate.webSocketApiBaseUrl)
      : null;
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
        query: this.getTokenTransferGraphQLQuery(operationHash, 'query')
      })
    });
    if (tokenTransferDtos.errors)
      throw new Error(`Indexer error: ${tokenTransferDtos.errors.join('\n')}`);

    const tokenTransfers = tokenTransferDtos.data.bridge_deposit
      .map(bridgeDepositDto => mappers.mapBridgeDepositDtoToDepositBridgeTokenTransfer(bridgeDepositDto));

    return tokenTransfers[0] || null;
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
    let tezosAddresses: string | readonly string[] | undefined;
    let etherlinkAddresses: string | readonly string[] | undefined;
    let offset: number | undefined;
    let limit: number | undefined;

    if (offsetOrAccountAddressOfAddresses !== undefined) {
      if (typeof offsetOrAccountAddressOfAddresses === 'number') {
        offset = offsetOrAccountAddressOfAddresses;
        limit = _offsetOrLimit;
      }
      else {
        // TODO: extract addresses
        tezosAddresses = offsetOrAccountAddressOfAddresses;
        etherlinkAddresses = offsetOrAccountAddressOfAddresses;
        offset = _offsetOrLimit;
        limit = limitParameter;
      }
    }

    const tokenTransferDtos = await this.fetch<GraphQLResponse<TokenTransferDto>>('/v1/graphql', 'json', {
      method: 'POST',
      body: JSON.stringify({
        query: this.getTokenTransfersGraphQLQuery(tezosAddresses, etherlinkAddresses, offset, limit)
      })
    });
    if (tokenTransferDtos.errors)
      throw new Error(`Indexer error: ${tokenTransferDtos.errors.join('\n')}`);

    return tokenTransferDtos.data.bridge_deposit
      .map(bridgeDepositDto => mappers.mapBridgeDepositDtoToDepositBridgeTokenTransfer(bridgeDepositDto));
  }

  subscribeToTokenTransfer(operationHash: string): void {
    if (!this.dipDupWebSocketClient)
      throw new Error('AutoUpdate is disabled');

    this.dipDupWebSocketClient.subscribe(this.getTokenTransferGraphQLQuery(operationHash, 'subscription'));
  }

  unsubscribeFromTokenTransfer(operationHash: string): void {
    if (!this.dipDupWebSocketClient)
      throw new Error('AutoUpdate is disabled');

    this.dipDupWebSocketClient.unsubscribe(this.getTokenTransferGraphQLQuery(operationHash, 'subscription'));
  }

  subscribeToTokenTransfers(): void;
  subscribeToTokenTransfers(accountAddress: string): void;
  subscribeToTokenTransfers(accountAddresses: readonly string[]): void;
  subscribeToTokenTransfers(_accountAddressOrAddresses?: string | readonly string[]): void {

  }

  unsubscribeFromTokenTransfers(): void;
  unsubscribeFromTokenTransfers(accountAddress: string): void;
  unsubscribeFromTokenTransfers(accountAddresses: readonly string[]): void;
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
    switch (message.type) {
      case 'data': {
        const tokenTransferDto = (message.payload as GraphQLResponse<TokenTransferDto>).data?.bridge_deposit?.[0];
        if (!tokenTransferDto)
          return;

        const tokenTransfer = mappers.mapBridgeDepositDtoToDepositBridgeTokenTransfer(tokenTransferDto);
        (this.events.tokenTransferUpdated as ToEventEmitter<typeof this.events.tokenTransferUpdated>).emit(
          tokenTransfer
        );

        break;
      }
    }
  };

  protected getTokenTransfersGraphQLQuery(
    tezosAddresses: string | readonly string[] | undefined,
    etherlinkAddresses: string | readonly string[] | undefined,
    _offset: number | undefined,
    _limit: number | undefined
  ): string {
    // TODO: remove when the backend will be updated
    etherlinkAddresses = etherlinkAddresses === undefined
      ? undefined
      : typeof etherlinkAddresses === 'string'
        ? etherlinkUtils.prepareHexPrefix(etherlinkAddresses, false)
        : etherlinkAddresses.map(address => etherlinkUtils.prepareHexPrefix(address, false));

    const depositWhereArgument = tezosAddresses && etherlinkAddresses
      ? `,
      where: {
			  _or: [
				  ${tezosAddresses ? `{ l1_transaction: { l1_account: { ${typeof tezosAddresses === 'string' ? `_eq: "${tezosAddresses}"` : `_in: ${tezosAddresses.join()}`} } } },` : ''}
          ${etherlinkAddresses ? `{ l1_transaction: { l2_account: { ${typeof etherlinkAddresses === 'string' ? `_eq: "${etherlinkAddresses}"` : `_in: ${etherlinkAddresses.join()}`} } },` : ''}
          ${etherlinkAddresses ? `{ l2_transaction: { l2_account: { ${typeof etherlinkAddresses === 'string' ? `_eq: "${etherlinkAddresses}"` : `_in: ${etherlinkAddresses.join()}`} } },` : ''}
        ]
      }`
      : '';

    return `query TokenTransfers {
  bridge_deposit(
    order_by: {l1_transaction: {timestamp: desc}}${depositWhereArgument}
  ) {
    ${DipDupBridgeDataProvider.bridgeDepositGraphQLFields}
}`;
  }

  protected getTokenTransferGraphQLQuery(operationHash: string, queryType: 'query' | 'subscription'): string {
    // TODO: remove when the backend will be updated
    operationHash = etherlinkUtils.prepareHexPrefix(operationHash, false);

    const whereArgument = `where: {
      _or: [
        { l1_transaction: { operation_hash: {_eq: "${operationHash}"}} },
        { l2_transaction: { transaction_hash: {_eq: "${operationHash}"}} }
      ]
    }`;

    return `${queryType} TokenTransfers {
  bridge_deposit(${whereArgument}) {
    ${DipDupBridgeDataProvider.bridgeDepositGraphQLFields}
  }
}`;
  }
}
