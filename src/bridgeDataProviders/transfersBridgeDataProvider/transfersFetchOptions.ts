import type { BridgeTokenTransferKind, BridgeTokenTransferStatus } from '../../bridgeCore';
import type { FetchOptions } from '../../common';

export interface TransfersFetchOptions extends FetchOptions {
  filter?: {
    kind?: BridgeTokenTransferKind[] | null;
    status?: BridgeTokenTransferStatus[] | null;
  }
}
