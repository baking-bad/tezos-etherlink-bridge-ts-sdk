import BigNumber from 'bignumber.js';

export interface Token {
}

export interface Blockchain {
  name: string;
  rpcUrl: string;

  sendTokens(token: Token, amount: BigNumber): Promise<void>;
}
