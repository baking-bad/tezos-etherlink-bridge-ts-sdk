import type { TokenPair } from '../../bridgeCore';
import type { EtherlinkToken } from '../../etherlink';
import type { TezosToken } from '../../tezos';

export interface TokensBridgeDataProvider {
  getRegisteredTokenPair(token: TezosToken | EtherlinkToken): Promise<TokenPair | null>;

  getRegisteredTokenPairs(): Promise<TokenPair[]>;
  getRegisteredTokenPairs(offset: number, limit: number): Promise<TokenPair[]>;
  getRegisteredTokenPairs(offset?: number, limit?: number): Promise<TokenPair[]>;
}
