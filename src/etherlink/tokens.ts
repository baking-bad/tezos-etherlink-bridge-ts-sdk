import type { Token } from '../common';

export interface ERC20Token extends Token {
  address: string;
}

export type EtherlinkToken = ERC20Token;
