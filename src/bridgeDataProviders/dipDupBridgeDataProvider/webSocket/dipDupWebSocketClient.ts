import type {
  DipDupWebSocketResponseDto,
  SubscribeToSubscriptionWebSocketRequestDto, UnsubscribeFromSubscriptionWebSocketRequestDto,
  WebSocketResponseDto
} from './dtos';
import { WebSocketClient, type WebSocketCloseEvent, type Subscription } from './webSocketClient';
import { EventEmitter, TimeoutScheduler, type PublicEventEmitter, type ToEventEmitter } from '../../../common';
import { textUtils } from '../../../utils';

interface DipDupWebSocketClientEvents {
  messageReceived: PublicEventEmitter<readonly [message: DipDupWebSocketResponseDto]>;
}

export class DipDupWebSocketClient {
  readonly events: DipDupWebSocketClientEvents = {
    messageReceived: new EventEmitter()
  };

  protected socket: WebSocketClient;
  protected subscriptions: Map<string, Subscription> = new Map();
  protected subscriptionIdCounter: number = 0;
  protected reconnectScheduler = new TimeoutScheduler([1000, 5000, 30000, 60000], 120000);

  private _isStarted = false;
  private _isStarting = false;

  constructor(protected readonly webSocketApiBaseUrl: string) {
    this.socket = new WebSocketClient(new URL(textUtils.trimSlashes(this.webSocketApiBaseUrl) + '/v1/graphql'));
  }

  get isStarted() {
    return this._isStarted;
  }

  async start(): Promise<void> {
    if (this.isStarted || this._isStarting)
      return;

    this._isStarting = true;

    try {
      this.socket.events.messageReceived.addListener(this.onSocketMessageReceived);
      this.socket.events.closed.addListener(this.onSocketClosed);
      await this.connect();
      this._isStarted = true;
    }
    catch (error: unknown) {
      this._isStarting = false;
      this._isStarted = false;
      throw new Error('Socket error', { cause: error });
    }
  }

  stop() {
    if (!this.isStarted)
      return;

    this.socket.events.messageReceived.removeListener(this.onSocketMessageReceived);
    this.socket.events.closed.removeListener(this.onSocketClosed);
    this.disconnect();
    this.reconnectScheduler[Symbol.dispose]();

    this._isStarted = false;
  }

  subscribe(query: string): boolean {
    let subscription = this.subscriptions.get(query);
    if (subscription) {
      subscription.subscribers++;
      return false;
    }

    subscription = {
      id: this.subscriptionIdCounter++,
      query,
      subscribers: 1,
    };

    this.subscribeToSubscription(subscription);
    this.subscriptions.set(subscription.query, subscription);

    return true;
  }

  unsubscribe(query: string): boolean {
    const subscription = this.subscriptions.get(query);
    if (!subscription)
      return false;

    if (--subscription.subscribers > 0)
      return false;

    this.unsubscribeFromSubscription(subscription.id);
    this.subscriptions.delete(subscription.query);

    return true;
  }

  protected async connect(): Promise<void> {
    await this.socket.connect();
    this.socket.send({
      type: 'connection_init',
      payload: {
        headers: {
          'content-type': 'application/json'
        },
        lazy: true
      }
    });

    for (const subscription of this.subscriptions.values()) {
      this.subscribeToSubscription(subscription);
    }
  }

  protected subscribeToSubscription(subscription: Subscription) {
    const message: SubscribeToSubscriptionWebSocketRequestDto = {
      type: 'start',
      id: subscription.id.toString(),
      payload: {
        query: subscription.query
      }
    };

    this.socket.send(message);
  }

  protected unsubscribeFromSubscription(subscriptionId: Subscription['id']) {
    const message: UnsubscribeFromSubscriptionWebSocketRequestDto = {
      type: 'stop',
      id: subscriptionId.toString()
    };

    this.socket.send(message);
  }

  protected disconnect(): void {
    this.socket.disconnect();
  }

  protected onSocketClosed = (_socket: WebSocketClient, _event: WebSocketCloseEvent) => {
    this.reconnectScheduler.setTimeout(() => {
      this.connect();
    });
  };

  protected onSocketMessageReceived = (message: unknown) => {
    switch ((message as WebSocketResponseDto).type) {
      case 'ka':
      case 'connection_ack':
        break;

      default:
        (this.events.messageReceived as ToEventEmitter<typeof this.events.messageReceived>).emit(message as DipDupWebSocketResponseDto);
    }
  };
}
