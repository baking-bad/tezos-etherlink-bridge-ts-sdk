import BigNumber from 'bignumber.js';

import { Blockchain, Token } from './blockchain';

export interface FA12Token extends Token {
  address: string;
}

export interface FA2Token extends Token {
  address: string;
  tokenId: string;
}

export interface TezosBlockchainOptions {
  rpcUrl: string;
  getTicketer: (token: FA12Token | FA2Token) => Promise<string>;
}

export class TezosBlockchain implements Blockchain {
  readonly name: string = 'tezos';
  readonly rpcUrl: string;
  constructor(options: TezosBlockchainOptions) {
    this.rpcUrl = options.rpcUrl;
  }

  async sendTokens(token: FA12Token | FA2Token, amount: BigNumber) {
    throw new Error('Method not implemented.');
  }
}
