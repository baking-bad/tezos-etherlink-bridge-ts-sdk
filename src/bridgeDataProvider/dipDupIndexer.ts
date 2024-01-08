import BigNumber from 'bignumber.js';

import type { BridgeDataProvider } from './bridgeDataProvider';
import type { TransferTokensBridgeOperationResult } from '../bridgeOperations';
import { EventEmitter, type Token } from '../common';
import type { TezosToken } from '../tezos';

export class DipDupIndexerBridgeDataProvider implements BridgeDataProvider {
  readonly events = {
    swapOperationUpdated: new EventEmitter()
  };

  constructor(readonly baseUrl: string) {
  }

  getTokenTransfers(userAddresses: string[]): Promise<TransferTokensBridgeOperationResult[]> {
    throw new Error('Method not implemented.');
  }

  getBalance(token: Token, accountAddress: string): Promise<BigNumber> {
    throw new Error('Method not implemented.');
  }

  getTezosTokenTicketer(tezosToken: TezosToken): Promise<string> {
    throw new Error('Method not implemented.');
  }
}
