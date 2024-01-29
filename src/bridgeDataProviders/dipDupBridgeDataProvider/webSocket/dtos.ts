export interface WebSocketRequestDto {
  method: string;
  data: unknown;
  requestId: number;
}

export interface WebSocketResponseBaseDto {
  event: string;
  data: unknown;
  requestId?: number;
}

export interface WebSocketBridgeTokenTransferResponseDto extends WebSocketResponseBaseDto {
  event: 'transfer';
  // TODO: create the BridgeTokenTransferDto type and use it here
  data: unknown;
}

export type WebSocketResponseDto =
  | WebSocketBridgeTokenTransferResponseDto;
