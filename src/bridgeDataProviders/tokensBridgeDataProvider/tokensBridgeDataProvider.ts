import type { TokenPair } from '../../bridge';
import type { NonNativeEtherlinkToken } from '../../etherlink';
import type { NonNativeTezosToken } from '../../tezos';

export interface TokensBridgeDataProvider {
  getRegisteredTokenPair(token: NonNativeTezosToken | NonNativeEtherlinkToken): Promise<TokenPair | null>;

  getRegisteredTokenPairs(): Promise<readonly TokenPair[]>;
  getRegisteredTokenPairs(offset: number, limit: number): Promise<readonly TokenPair[]>;
}
