import type { TransfersFetchOptions } from './transfersFetchOptions';
import type { BridgeTokenTransfer, CreatedBridgeTokenDeposit, CreatedBridgeTokenWithdrawal } from '../../bridgeCore';
import type { PublicEventEmitter } from '../../common';

interface TransfersBridgeDataProviderEvents {
  readonly tokenTransferCreated: PublicEventEmitter<readonly [tokenTransfer: CreatedBridgeTokenDeposit | CreatedBridgeTokenWithdrawal]>;
  readonly tokenTransferUpdated: PublicEventEmitter<readonly [tokenTransfer: BridgeTokenTransfer]>;
}

export interface TransfersBridgeDataProvider {
  readonly events: TransfersBridgeDataProviderEvents;

  getTokenTransfer(tokenTransferId: string): Promise<BridgeTokenTransfer | null>;

  getTokenTransfers(): Promise<BridgeTokenTransfer[]>;
  getTokenTransfers(fetchOptions: TransfersFetchOptions): Promise<BridgeTokenTransfer[]>;
  getTokenTransfers(fetchOptions?: TransfersFetchOptions): Promise<BridgeTokenTransfer[]>;

  getAccountTokenTransfers(accountAddress: string): Promise<BridgeTokenTransfer[]>;
  getAccountTokenTransfers(accountAddresses: readonly string[]): Promise<BridgeTokenTransfer[]>;
  getAccountTokenTransfers(accountAddress: string, fetchOptions: TransfersFetchOptions): Promise<BridgeTokenTransfer[]>;
  getAccountTokenTransfers(accountAddresses: readonly string[], fetchOptions: TransfersFetchOptions): Promise<BridgeTokenTransfer[]>;
  getAccountTokenTransfers(accountAddressOfAddresses: string | readonly string[], fetchOptions?: TransfersFetchOptions): Promise<BridgeTokenTransfer[]>;

  getOperationTokenTransfers(operationHash: string): Promise<BridgeTokenTransfer[]>;
  getOperationTokenTransfers(tokenTransfer: BridgeTokenTransfer): Promise<BridgeTokenTransfer[]>;
  getOperationTokenTransfers(operationHashOrTokenTransfer: string | BridgeTokenTransfer): Promise<BridgeTokenTransfer[]>;

  subscribeToTokenTransfer(tokenTransferId: string): void;

  unsubscribeFromTokenTransfer(tokenTransferId: string): void;

  subscribeToTokenTransfers(): void;

  unsubscribeFromTokenTransfers(): void;

  subscribeToAccountTokenTransfers(accountAddress: string): void;
  subscribeToAccountTokenTransfers(accountAddresses: readonly string[]): void;
  subscribeToAccountTokenTransfers(accountAddressOrAddresses: string | readonly string[]): void;

  unsubscribeFromAccountTokenTransfers(accountAddress: string): void;
  unsubscribeFromAccountTokenTransfers(accountAddresses: readonly string[]): void;
  unsubscribeFromAccountTokenTransfers(accountAddressOrAddresses: string | readonly string[]): void;

  subscribeToOperationTokenTransfers(operationHash: string): void;
  subscribeToOperationTokenTransfers(tokenTransfer: BridgeTokenTransfer): void;
  subscribeToOperationTokenTransfers(operationHashOrTokenTransfer: string | BridgeTokenTransfer): void;

  unsubscribeFromOperationTokenTransfers(operationHash: string): void;
  unsubscribeFromOperationTokenTransfers(tokenTransfer: BridgeTokenTransfer): void;
  unsubscribeFromOperationTokenTransfers(operationHashOrTokenTransfer: string | BridgeTokenTransfer): void;

  unsubscribeFromAllSubscriptions(): void;
}
