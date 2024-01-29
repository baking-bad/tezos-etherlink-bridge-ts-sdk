import type { TezosToolkit } from '@taquito/taquito';
import type Web3 from 'web3';

import { DipDupBridgeDataProvider, type LocalTokensBridgeDataProvider, type TokensBridgeDataProvider } from './bridgeDataProviders';
import { TokenBridge } from './tokenBridge';

interface DefaultTezosTokenBridgeOptions {
  toolkit: TezosToolkit;
  rollupAddress: string;
}

interface DefaultEtherlinkTokenBridgeOptions {
  toolkit: Web3;
}

interface DefaultDipDupBridgeDataProvider {
  baseUrl: string;
}

export interface DefaultTokenBridgeOptions {
  tezos: DefaultTezosTokenBridgeOptions;
  etherlink: DefaultEtherlinkTokenBridgeOptions;
  tokenPairs: TokensBridgeDataProvider | LocalTokensBridgeDataProvider,
  dipDup: DefaultDipDupBridgeDataProvider
}

export const defaultEtherlinkKernelAddress = '0x0000000000000000000000000000000000000000';
export const defaultEtherlinkWithdrawPrecompileAddress = '0x0000000000000000000000000000000000000040';

export const createDefaultTokenBridge = (options: DefaultTokenBridgeOptions): TokenBridge => {
  const dipDup = new DipDupBridgeDataProvider({
    baseUrl: options.dipDup.baseUrl,
    autoUpdate: 'websocket'
  });

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
      tokens: options.tokenPairs,
      balances: dipDup,
      transfers: dipDup
    }
  });
};
