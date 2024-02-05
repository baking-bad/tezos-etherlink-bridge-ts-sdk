import type { BridgeTokenTransfer } from '../../bridge';
import type { PublicEventEmitter } from '../../common';

interface TransfersBridgeDataProviderEvents {
  readonly tokenTransferCreated: PublicEventEmitter<readonly [tokenTransfer: BridgeTokenTransfer]>;
  readonly tokenTransferUpdated: PublicEventEmitter<readonly [tokenTransfer: BridgeTokenTransfer]>;
}

export interface TransfersBridgeDataProvider {
  readonly events: TransfersBridgeDataProviderEvents;

  getTokenTransfer(operationHash: string): Promise<BridgeTokenTransfer | null>;
  getTokenTransfer(tokenTransfer: BridgeTokenTransfer): Promise<BridgeTokenTransfer | null>;

  getTokenTransfers(): Promise<BridgeTokenTransfer[]>;
  getTokenTransfers(offset: number, limit: number): Promise<BridgeTokenTransfer[]>;
  getTokenTransfers(accountAddress: string): Promise<BridgeTokenTransfer[]>;
  getTokenTransfers(accountAddresses: readonly string[]): Promise<BridgeTokenTransfer[]>;
  getTokenTransfers(accountAddress: string, offset: number, limit: number): Promise<BridgeTokenTransfer[]>;
  getTokenTransfers(accountAddresses: readonly string[], offset: number, limit: number): Promise<BridgeTokenTransfer[]>;

  subscribeToTokenTransfer(operationHash: string): void;

  unsubscribeFromTokenTransfer(operationHash: string): void;

  subscribeToTokenTransfers(): void;
  subscribeToTokenTransfers(accountAddress: string): void;
  subscribeToTokenTransfers(accountAddresses: readonly string[]): void;
  subscribeToTokenTransfers(accountAddressOrAddresses?: string | readonly string[]): void;

  unsubscribeFromTokenTransfers(): void;
  unsubscribeFromTokenTransfers(accountAddress: string): void;
  unsubscribeFromTokenTransfers(accountAddresses: readonly string[]): void;
  unsubscribeFromTokenTransfers(accountAddressOrAddresses?: string | readonly string[]): void;

  unsubscribeFromAllTokenTransfers(): void;
}
