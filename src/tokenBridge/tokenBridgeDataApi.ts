import type { TokensBridgeDataProvider, BalancesBridgeDataProvider, TransfersBridgeDataProvider } from '../bridgeDataProviders';

export interface TokenBridgeDataApi extends Pick<TokensBridgeDataProvider, 'getRegisteredTokenPair' | 'getRegisteredTokenPairs'>,
  Pick<BalancesBridgeDataProvider, 'getBalance' | 'getBalances'>,
  Pick<TransfersBridgeDataProvider, 'getTokenTransfer' | 'getTokenTransfers'> {
}
