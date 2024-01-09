import BigNumber from 'bignumber.js';

import type { BridgeDataProvider, TokenPair } from './bridgeDataProvider';
import type { BridgeTokenTransfer } from '../bridgeOperations';
import { EventEmitter, type Token } from '../common';
import type { EtherlinkToken } from '../etherlink';
import type { TezosToken } from '../tezos';

export class DipDupIndexerBridgeDataProvider implements BridgeDataProvider {
  readonly events = {
    swapOperationUpdated: new EventEmitter()
  };

  constructor(readonly baseUrl: string) {
  }

  getRegisteredTokenPair(token: TezosToken | EtherlinkToken): Promise<TokenPair | null> {

    throw new Error('Method not implemented.');
  }

  getRegisteredTokenPairs(): Promise<TokenPair[]> {
    throw new Error('Method not implemented.');
  }

  getTokenTransfers(userAddresses: string[]): Promise<BridgeTokenTransfer[]> {
    throw new Error('Method not implemented.');
  }

  getBalance(token: Token, accountAddress: string): Promise<BigNumber> {
    throw new Error('Method not implemented.');
  }

  getTezosTokenTicketer(tezosToken: TezosToken): Promise<string> {
    throw new Error('Method not implemented.');
  }
}
