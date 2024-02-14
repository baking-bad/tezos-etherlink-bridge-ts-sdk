interface WebSocketAutoUpdateOptions {
  type: 'websocket'
  webSocketApiBaseUrl: string;
  startImmediately?: boolean;
}

export interface DipDupBridgeDataProviderOptions {
  baseUrl: string;
  autoUpdate: WebSocketAutoUpdateOptions | false;
}
