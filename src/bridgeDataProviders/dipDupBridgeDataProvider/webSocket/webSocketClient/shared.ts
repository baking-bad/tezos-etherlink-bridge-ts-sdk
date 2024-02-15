import type { PublicEventEmitter } from '../../../../common';

export const enum ReadyState {
  Connecting = 0,
  Open = 1,
  Closing = 2,
  Closed = 3
}

export interface WebSocketClient<TSocket, TCloseEvent> {
  readonly events: {
    messageReceived: PublicEventEmitter<readonly [message: unknown]>;
    closed: PublicEventEmitter<readonly [socket: TSocket, event: TCloseEvent]>;
  }

  get readyState(): ReadyState;

  connect(): Promise<void>;
  disconnect(): void;
  send<TMessage>(message: TMessage): void;
}
