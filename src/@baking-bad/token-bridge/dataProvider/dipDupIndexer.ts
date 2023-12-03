import BigNumber from 'bignumber.js';

import { BridgeDataProvider } from './dataProvider';
import { Token } from '../blockchain/blockchain';
import { FA12Token, FA2Token } from '../blockchain/tezos';
import { EventEmitter } from '../common';
import { SwapOperation } from '../tokenBridge';

export class DipDupIndexerBridgeDataProvider implements BridgeDataProvider {
  readonly events = {
    swapOperationUpdated: new EventEmitter()
  };

  constructor(readonly baseUrl: string) {
  }

  getBalance(token: Token, account: string): Promise<BigNumber> {
    throw new Error('Method not implemented.');
  }

  getAllTokenPairs(): Promise<Array<readonly [Token, Token]>> {
    throw new Error('Method not implemented.');
  }

  getSwapOperations(): Promise<SwapOperation[]> {
    throw new Error('Method not implemented.');
  }

  getTezosTokenTicketer(tezosToken: FA12Token | FA2Token): Promise<string> {
    throw new Error('Method not implemented.');
  }
}
