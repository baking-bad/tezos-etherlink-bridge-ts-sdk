import type { TokenPairInfo } from '../../bridge';
import type { EtherlinkToken } from '../../etherlink';
import type { TezosToken } from '../../tezos';

export interface TokensBridgeDataProvider {
  getRegisteredTokenPair(token: TezosToken | EtherlinkToken): Promise<TokenPairInfo | null>;

  getRegisteredTokenPairs(): Promise<TokenPairInfo[]>;
  getRegisteredTokenPairs(offset: number, limit: number): Promise<TokenPairInfo[]>;
}
