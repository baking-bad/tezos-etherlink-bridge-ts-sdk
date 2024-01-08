import type { Token } from '../common';

export interface FA12Token extends Token {
  address: string;
}

export interface FA2Token extends Token {
  address: string;
  tokenId: string;
}

export type TezosToken =
  | FA12Token
  | FA2Token;
