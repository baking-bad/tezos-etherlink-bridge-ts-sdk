import type { TokenPair } from '../../bridgeCore';
import type { TokensBridgeDataProvider } from '../tokensBridgeDataProvider';

interface DefaultDipDupBridgeDataProvider {
  baseUrl: string;
  webSocketApiBaseUrl: string;
}

export interface DefaultDataProviderOptions {
  tokenPairs: TokensBridgeDataProvider | ReadonlyArray<Readonly<TokenPair>>;
  dipDup: DefaultDipDupBridgeDataProvider;
  tzKTApiBaseUrl: string;
}
