import { DipDupWebSocketClient, type DipDupWebSocketResponseDto } from './webSocket';
import type { BridgeTokenTransfer } from '../../bridge';
import { EventEmitter, type TokenBridgeService } from '../../common';
import type { EtherlinkToken } from '../../etherlink';
import type { TezosToken } from '../../tezos';
import type { BalancesBridgeDataProvider, AccountTokenBalanceInfo } from '../balancesBridgeDataProvider';
import type { TransfersBridgeDataProvider } from '../transfersBridgeDataProvider';

export interface DipDupBridgeDataProviderOptions {
  baseUrl: string;
  autoUpdate?: 'websocket' | 'polling' | false;
}

export class DipDupBridgeDataProvider implements TransfersBridgeDataProvider, BalancesBridgeDataProvider, TokenBridgeService, Disposable {
  static readonly defaultOptions = {
    autoUpdate: 'websocket'
  } as const;

  readonly baseUrl: string;
  readonly events: TransfersBridgeDataProvider['events'] = {
    tokenTransferUpdated: new EventEmitter()
  };

  protected readonly dipDupWebSocketClient: DipDupWebSocketClient | undefined;

  private _isStarted = false;

  constructor(baseUrl: string);
  constructor(options: DipDupBridgeDataProviderOptions);
  constructor(baseUrlOrOptions: string | DipDupBridgeDataProviderOptions) {
    if (typeof baseUrlOrOptions === 'string') {
      this.baseUrl = baseUrlOrOptions;
      this.dipDupWebSocketClient = new DipDupWebSocketClient(this.baseUrl);
    }
    else {
      this.baseUrl = baseUrlOrOptions.baseUrl;
      const autoUpdate = baseUrlOrOptions.autoUpdate === false ? false : (baseUrlOrOptions.autoUpdate || DipDupBridgeDataProvider.defaultOptions.autoUpdate);
      if (autoUpdate === 'websocket') {
        this.dipDupWebSocketClient = new DipDupWebSocketClient(this.baseUrl);
      }
    }
  }

  get isStarted() {
    return this._isStarted;
  }

  async start() {
    if (this.isStarted)
      return;

    if (this.dipDupWebSocketClient) {
      this.dipDupWebSocketClient.events.messageReceived.addListener(this.onSocketMessageReceived);
      await this.dipDupWebSocketClient.start();
    }

    this._isStarted = true;
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

  getTokenTransfer(operationHash: string): Promise<BridgeTokenTransfer | null>;
  getTokenTransfer(tokenTransfer: BridgeTokenTransfer): Promise<BridgeTokenTransfer | null>;
  getTokenTransfer(_operationHashOrTokenTransfer: string | BridgeTokenTransfer): Promise<BridgeTokenTransfer | null> {
    throw new Error('Method not implemented.');
  }

  getTokenTransfers(userAddresses: readonly string[]): Promise<BridgeTokenTransfer[]>;
  getTokenTransfers(userAddresses: readonly string[], offset: number, limit: number): Promise<BridgeTokenTransfer[]>;
  getTokenTransfers(_userAddresses: readonly string[], _offset?: number, _limit?: number): Promise<BridgeTokenTransfer[]> {
    throw new Error('Method not implemented.');
  }

  getBalance(accountAddress: string, token: TezosToken | EtherlinkToken): Promise<AccountTokenBalanceInfo> {
    throw new Error('Method not implemented.');
  }
  getBalances(accountAddress: string): Promise<AccountTokenBalanceInfo>;
  getBalances(accountAddress: string, offset: number, limit: number): Promise<AccountTokenBalanceInfo>;
  getBalances(accountAddress: unknown, offset?: unknown, limit?: unknown): Promise<AccountTokenBalanceInfo> {
    throw new Error('Method not implemented.');
  }

  protected readonly onSocketMessageReceived = (message: DipDupWebSocketResponseDto) => {
    switch (message.event) {
      case 'transfer':
        // TODO: map DTO to the model
        // (this.events.tokenTransferUpdated as ToEventEmitter<typeof this.events.tokenTransferUpdated>).emit(
        //  mapDtoToModel(message.data)
        // );
        break;
    }
  };

  [Symbol.dispose]() {
    this.stop();
  }
}
