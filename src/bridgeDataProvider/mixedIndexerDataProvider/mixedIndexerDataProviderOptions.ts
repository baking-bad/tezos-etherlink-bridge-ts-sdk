import type { TokenPairsProvider } from './providers';

export interface MixedIndexerDataProviderOptions {
  tzktApiBaseUrl: string;
  registeredTokenPairsProvider: TokenPairsProvider;
}
