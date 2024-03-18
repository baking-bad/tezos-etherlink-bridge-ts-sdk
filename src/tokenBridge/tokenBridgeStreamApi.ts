import type { TransfersBridgeDataProvider } from '../bridgeDataProviders';

export interface TokenBridgeStreamApi extends Pick<
  TransfersBridgeDataProvider,
  | 'subscribeToTokenTransfer'
  | 'subscribeToTokenTransfers'
  | 'subscribeToAccountTokenTransfers'
  | 'subscribeToOperationTokenTransfers'
  | 'unsubscribeFromTokenTransfer'
  | 'unsubscribeFromTokenTransfers'
  | 'unsubscribeFromAccountTokenTransfers'
  | 'unsubscribeFromOperationTokenTransfers'
  | 'unsubscribeFromAllSubscriptions'
> {
}
