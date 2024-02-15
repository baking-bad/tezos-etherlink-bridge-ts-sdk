import { WebSocket, type MessageEvent, type ErrorEvent, type CloseEvent } from 'ws';

import type { WebSocketClient as WebSocketClientInterface } from './shared';
import { EventEmitter, type ToEventEmitter } from '../../../../common';

export type WebSocketCloseEvent = CloseEvent;

export class WebSocketClient implements WebSocketClientInterface<WebSocketClient, WebSocketCloseEvent> {
  protected static readonly webSocketProtocol = 'graphql-ws';

  readonly events: WebSocketClientInterface<WebSocketClient, WebSocketCloseEvent>['events'] = {
    messageReceived: new EventEmitter(),
    closed: new EventEmitter()
  };

  get readyState() {
    return this.socket.readyState;
  }

  protected _socket: WebSocket | undefined;

  protected get socket(): WebSocket {
    if (!this._socket)
      throw new Error('Internal websocket is not created. Use the connect method first');

    return this._socket;
  }

  constructor(protected readonly url: string | URL) {
  }

  async connect(): Promise<void> {
    this.disconnect();

    return new Promise((resolve, reject) => {
      this._socket = new WebSocket(this.url, WebSocketClient.webSocketProtocol);

      this.socket.once('open', () => resolve());
      this.socket.once('error', error => reject(error));

      this.socket.addEventListener('message', this.onMessageReceived);
      this.socket.addEventListener('error', this.onError);
      this.socket.addEventListener('close', this.onClosed);
    });
  }

  disconnect() {
    if (!this._socket)
      return;

    this.socket.off('message', this.onMessageReceived);
    this.socket.off('error', this.onError);
    this.socket.off('close', this.onClosed);
    this.socket.close();
  }

  send<T>(message: T) {
    this.socket.send(JSON.stringify(message));
  }

  protected onMessageReceived = (event: MessageEvent) => {
    try {
      const data = JSON.parse(event.data as string);

      (this.events.messageReceived as ToEventEmitter<typeof this.events.messageReceived>).emit(data);
    }
    catch (error) {
      console.error(error);
    }
  };

  protected onError = (event: ErrorEvent) => {
    throw new Error(`Websocket received error: ${JSON.stringify(event)}`);
  };

  protected onClosed = (event: WebSocketCloseEvent) => {
    (this.events.closed as ToEventEmitter<typeof this.events.closed>).emit(this, event);
  };
}
