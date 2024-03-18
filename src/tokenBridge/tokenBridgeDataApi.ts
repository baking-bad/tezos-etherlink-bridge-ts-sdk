import type { BridgeTokenTransfer } from '../bridgeCore';
import type {
  TokensBridgeDataProvider, BalancesBridgeDataProvider, TransfersBridgeDataProvider,
  AccountTokenBalances, TransfersFetchOptions
} from '../bridgeDataProviders';

export interface SignerTokenBalances {
  tezosSignerBalances?: AccountTokenBalances
  etherlinkSignerBalances?: AccountTokenBalances;
}

export interface TokenBridgeDataApi extends Pick<TokensBridgeDataProvider, 'getRegisteredTokenPair' | 'getRegisteredTokenPairs'>,
  Pick<BalancesBridgeDataProvider, 'getBalance' | 'getBalances'>,
  Pick<TransfersBridgeDataProvider, 'getTokenTransfer' | 'getTokenTransfers' | 'getAccountTokenTransfers' | 'getOperationTokenTransfers'> {
  getSignerBalances(): Promise<SignerTokenBalances>;

  getSignerTokenTransfers(): Promise<BridgeTokenTransfer[]>;
  getSignerTokenTransfers(fetchOptions: TransfersFetchOptions): Promise<BridgeTokenTransfer[]>;
  getSignerTokenTransfers(fetchOptions?: TransfersFetchOptions): Promise<BridgeTokenTransfer[]>;
}
