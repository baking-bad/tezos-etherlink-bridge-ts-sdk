import type { TokensFetchOptions } from './tokensFetchOptions';
import type { TokenPair } from '../../bridgeCore';
import type { TezosToken, EtherlinkToken } from '../../tokens';

export interface TokensBridgeDataProvider {
  getRegisteredTokenPair(token: TezosToken | EtherlinkToken): Promise<TokenPair | null>;

  getRegisteredTokenPairs(): Promise<TokenPair[]>;
  getRegisteredTokenPairs(fetchOptions: TokensFetchOptions): Promise<TokenPair[]>;
  getRegisteredTokenPairs(fetchOptions?: TokensFetchOptions): Promise<TokenPair[]>;
}
