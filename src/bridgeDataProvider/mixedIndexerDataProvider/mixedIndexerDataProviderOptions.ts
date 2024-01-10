import type { TokenPairsProvider } from './providers';

export interface MixedIndexerDataProviderOptions {
  tzktApiBaseUrl: string;
  blockscoutBaseUrl: string;
  registeredTokenPairsProvider: TokenPairsProvider;
  tezosRollupAddress: string;
  etherlinkKernelAddress: string;
  etherlinkWithdrawPrecompileAddress: string;
}
