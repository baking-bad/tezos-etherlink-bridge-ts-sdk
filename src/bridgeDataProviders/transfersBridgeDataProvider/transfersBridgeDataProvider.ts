import type { BridgeTokenTransfer } from '../../bridgeCore';
import type { PublicEventEmitter } from '../../common';

interface TransfersBridgeDataProviderEvents {
  readonly tokenTransferCreated: PublicEventEmitter<readonly [tokenTransfer: BridgeTokenTransfer]>;
  readonly tokenTransferUpdated: PublicEventEmitter<readonly [tokenTransfer: BridgeTokenTransfer]>;
}

export interface TransfersBridgeDataProvider {
  readonly events: TransfersBridgeDataProviderEvents;

  getTokenTransfer(operationHash: string): Promise<BridgeTokenTransfer | null>;
  getTokenTransfer(tokenTransfer: BridgeTokenTransfer): Promise<BridgeTokenTransfer | null>;
  getTokenTransfer(operationHashOrTokenTransfer: string | BridgeTokenTransfer): Promise<BridgeTokenTransfer | null>;

  getTokenTransfers(): Promise<BridgeTokenTransfer[]>;
  getTokenTransfers(offset: number, limit: number): Promise<BridgeTokenTransfer[]>;
  getTokenTransfers(accountAddress: string): Promise<BridgeTokenTransfer[]>;
  getTokenTransfers(accountAddresses: readonly string[]): Promise<BridgeTokenTransfer[]>;
  getTokenTransfers(accountAddress: string, offset: number, limit: number): Promise<BridgeTokenTransfer[]>;
  getTokenTransfers(accountAddresses: readonly string[], offset: number, limit: number): Promise<BridgeTokenTransfer[]>;
  getTokenTransfers(
    offsetOrAccountAddressOfAddresses?: number | string | readonly string[],
    offsetOrLimit?: number,
    limitParameter?: number
  ): Promise<BridgeTokenTransfer[]>;

  subscribeToTokenTransfer(operationHash: string): void;
  subscribeToTokenTransfer(tokenTransfer: BridgeTokenTransfer): void;
  subscribeToTokenTransfer(operationHashOrTokenTransfer: string | BridgeTokenTransfer): void;
  unsubscribeFromTokenTransfer(operationHash: string): void;
  unsubscribeFromTokenTransfer(tokenTransfer: BridgeTokenTransfer): void;
  unsubscribeFromTokenTransfer(operationHashOrTokenTransfer: string | BridgeTokenTransfer): void;

  subscribeToTokenTransfers(): void;

  unsubscribeFromTokenTransfers(): void;

  subscribeToAccountTokenTransfers(accountAddress: string): void;
  subscribeToAccountTokenTransfers(accountAddresses: readonly string[]): void;
  subscribeToAccountTokenTransfers(accountAddressOrAddresses?: string | readonly string[]): void;

  unsubscribeFromAccountTokenTransfers(accountAddress: string): void;
  unsubscribeFromAccountTokenTransfers(accountAddresses: readonly string[]): void;
  unsubscribeFromAccountTokenTransfers(accountAddressOrAddresses?: string | readonly string[]): void;

  unsubscribeFromAllSubscriptions(): void;
}
