import type { Token } from './token';

export interface NativeTezosToken extends Token {
  readonly type: 'native';
}

export interface FA12TezosToken extends Token {
  readonly type: 'fa1.2';
  readonly address: string;
}

export interface FA2TezosToken extends Token {
  readonly type: 'fa2';
  readonly address: string;
  readonly tokenId: string;
}

export type NonNativeTezosToken =
  | FA12TezosToken
  | FA2TezosToken;

export type TezosToken = NativeTezosToken | NonNativeTezosToken;
