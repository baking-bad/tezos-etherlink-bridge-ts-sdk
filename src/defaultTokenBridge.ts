import type { TezosToolkit } from '@taquito/taquito';
import type Web3 from 'web3';

import type { TokenPair } from './bridge';
import {
  DipDupBridgeDataProvider, LocalTokensBridgeDataProvider,
  type TokensBridgeDataProvider, type DipDupBridgeDataProviderOptions
} from './bridgeDataProviders';
import { TokenBridge } from './tokenBridge';
import { guards } from './utils';

interface DefaultTezosTokenBridgeOptions {
  toolkit: TezosToolkit;
  rollupAddress: string;
}

interface DefaultEtherlinkTokenBridgeOptions {
  toolkit: Web3;
}

interface DefaultDipDupBridgeDataProvider {
  baseUrl: DipDupBridgeDataProviderOptions['baseUrl'];
  autoUpdate: DipDupBridgeDataProviderOptions['autoUpdate'];
}

export interface DefaultTokenBridgeOptions {
  tezos: DefaultTezosTokenBridgeOptions;
  etherlink: DefaultEtherlinkTokenBridgeOptions;
  tokenPairs: TokensBridgeDataProvider | ReadonlyArray<Readonly<TokenPair>>;
  dipDup: DefaultDipDupBridgeDataProvider;
}

export const defaultEtherlinkKernelAddress = '0x0000000000000000000000000000000000000000';
export const defaultEtherlinkWithdrawPrecompileAddress = '0x0000000000000000000000000000000000000040';

export const createDefaultTokenBridge = (options: DefaultTokenBridgeOptions): TokenBridge => {
  const dipDup = new DipDupBridgeDataProvider(options.dipDup);
  const tokensProvider = guards.isReadonlyArray(options.tokenPairs)
    ? new LocalTokensBridgeDataProvider(options.tokenPairs)
    : options.tokenPairs;

  return new TokenBridge({
    tezos: {
      toolkit: options.tezos.toolkit,
      bridgeOptions: {
        rollupAddress: options.tezos.rollupAddress
      }
    },
    etherlink: {
      toolkit: options.etherlink.toolkit,
      bridgeOptions: {
        kernelAddress: defaultEtherlinkKernelAddress,
        withdrawPrecompileAddress: defaultEtherlinkWithdrawPrecompileAddress
      }
    },
    bridgeDataProviders: {
      tokens: tokensProvider,
      balances: dipDup,
      transfers: dipDup
    }
  });
};
