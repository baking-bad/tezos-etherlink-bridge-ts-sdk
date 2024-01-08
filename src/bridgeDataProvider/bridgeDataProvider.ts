import type { TransferTokensBridgeOperationResult } from '../bridgeOperations';
import type { EventEmitter } from '../common';

export interface BridgeDataProvider {
  events: {
    swapOperationUpdated: EventEmitter<readonly [args: any]>
  }

  getTokenTransfers(userAddresses: string[]): Promise<TransferTokensBridgeOperationResult[]>;
}
