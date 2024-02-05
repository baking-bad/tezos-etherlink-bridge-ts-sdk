import type { PublicEventEmitter } from '../../../../common';

export interface WebSocketClient<TSocket, TCloseEvent> {
  readonly events: {
    messageReceived: PublicEventEmitter<readonly [message: unknown]>;
    closed: PublicEventEmitter<readonly [socket: TSocket, event: TCloseEvent]>;
  }

  connect(): Promise<void>;
  disconnect(): void;
  send<TMessage>(message: TMessage): void;
}
