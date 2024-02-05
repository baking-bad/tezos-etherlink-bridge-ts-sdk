import type { TokensBridgeDataProvider, BalancesBridgeDataProvider, TransfersBridgeDataProvider } from './bridgeDataProviders';

export interface TokenBridgeDataFacade extends Pick<TokensBridgeDataProvider, 'getRegisteredTokenPair' | 'getRegisteredTokenPairs'>,
  Pick<BalancesBridgeDataProvider, 'getBalance' | 'getBalances'>,
  Pick<TransfersBridgeDataProvider, 'getTokenTransfer' | 'getTokenTransfers'> {
}
