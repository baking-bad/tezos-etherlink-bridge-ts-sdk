import type { BridgeTokenTransfer } from '../../bridge';
import type { PublicEventEmitter } from '../../common';

interface TransfersBridgeDataProviderEvents {
  readonly tokenTransferUpdated: PublicEventEmitter<readonly [tokenTransfer: BridgeTokenTransfer]>;
}

export interface TransfersBridgeDataProvider {
  readonly events: TransfersBridgeDataProviderEvents;

  getTokenTransfer(operationHash: string): Promise<BridgeTokenTransfer | null>;
  getTokenTransfer(tokenTransfer: BridgeTokenTransfer): Promise<BridgeTokenTransfer | null>;

  getTokenTransfers(userAddresses: readonly string[]): Promise<BridgeTokenTransfer[]>;
  getTokenTransfers(userAddresses: readonly string[], offset: number, limit: number): Promise<BridgeTokenTransfer[]>;
}
