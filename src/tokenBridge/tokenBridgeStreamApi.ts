import type { TransfersBridgeDataProvider } from '../bridgeDataProviders';

export interface TokenBridgeStreamApi extends Pick<
  TransfersBridgeDataProvider,
  | 'subscribeToTokenTransfer'
  | 'subscribeToTokenTransfers'
  | 'subscribeToAccountTokenTransfers'
  | 'unsubscribeFromTokenTransfer'
  | 'unsubscribeFromTokenTransfers'
  | 'unsubscribeFromAccountTokenTransfers'
  | 'unsubscribeFromAllSubscriptions'
> {
}
