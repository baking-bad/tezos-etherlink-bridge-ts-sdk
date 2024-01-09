import type { EtherlinkToken } from '../../../etherlink';
import type { TezosToken } from '../../../tezos';
import type { TokenPair } from '../../bridgeDataProvider';

export interface TokenPairsProvider {
  getPair(token: TezosToken | EtherlinkToken): Promise<TokenPair | null>;
  getPairs(): Promise<TokenPair[]>;
}
