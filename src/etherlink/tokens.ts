import type { Token } from '../common';

export interface NativeEtherlinkToken extends Token {
  readonly type: 'native';
}

export interface ERC20EtherlinkToken extends Token {
  readonly type: 'erc20';
  readonly address: string;
}

export type NonNativeEtherlinkToken = ERC20EtherlinkToken;

export type EtherlinkToken = NativeEtherlinkToken | NonNativeEtherlinkToken;
