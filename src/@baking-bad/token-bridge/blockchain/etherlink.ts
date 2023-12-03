import BigNumber from 'bignumber.js';

import { Blockchain, Token } from './blockchain';

export interface ERC20Token extends Token {
  address: string;
}

export interface EtherlinkBlockchainOptions {
  rpcUrl: string;
}

export class EtherlinkBlockchain implements Blockchain {
  readonly name: string = 'etherlink';
  readonly rpcUrl: string;
  constructor(options: EtherlinkBlockchainOptions) {
    this.rpcUrl = options.rpcUrl;
  }

  async sendTokens(token: ERC20Token, amount: BigNumber) {

  }
}
