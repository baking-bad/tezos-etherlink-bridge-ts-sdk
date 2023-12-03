import { Token } from '../blockchain/blockchain';
import { EventEmitter } from '../common';
import { SwapOperation } from '../tokenBridge';

export interface BridgeDataProvider {
  events: {
    swapOperationUpdated: EventEmitter<readonly [args: any]>
  }

  getAllTokenPairs(): Promise<Array<readonly [Token, Token]>>;
  getSwapOperations(userAddresses: string[]): Promise<SwapOperation[]>;
}
