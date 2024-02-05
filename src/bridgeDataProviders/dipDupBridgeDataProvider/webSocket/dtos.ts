import type { GraphQLResponse } from '../dtos';

export interface WebSocketRequestBaseDto {
  type: string;
}

export interface SubscribeToSubscriptionWebSocketRequestDto extends WebSocketRequestBaseDto {
  type: 'start';
  id: string;
  payload: {
    query: string;
  }
}

export interface UnsubscribeFromSubscriptionWebSocketRequestDto extends WebSocketRequestBaseDto {
  type: 'stop';
  id: string;
}

export type WebSocketRequestDto =
  | SubscribeToSubscriptionWebSocketRequestDto
  | UnsubscribeFromSubscriptionWebSocketRequestDto;

export interface WebSocketResponseBaseDto {
  type: string;
}

export interface HeartbeatWebSocketResponseDto {
  type: 'ka';
}

export interface ConnectionAcknowledgmentWebSocketResponseDto {
  type: 'connection_ack';
}

export interface DataWebSocketResponseDto<TData = unknown> {
  type: 'data';
  id: string;
  payload: GraphQLResponse<TData>
}

export type WebSocketResponseDto =
  | HeartbeatWebSocketResponseDto
  | ConnectionAcknowledgmentWebSocketResponseDto
  | DataWebSocketResponseDto;

export type DipDupWebSocketResponseDto = Exclude<
  WebSocketResponseDto,
  HeartbeatWebSocketResponseDto | ConnectionAcknowledgmentWebSocketResponseDto
>;
