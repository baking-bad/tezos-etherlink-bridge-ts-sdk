import type { TezosToolkit } from '@taquito/taquito';
import type Web3 from 'web3';

import type { BridgeDataProvider } from './bridgeDataProvider';
import type { Network } from './common';

export interface TokenBridgeOptions {
  network: Network;
  tezos: {
    toolkit: TezosToolkit;
    bridgeOptions: {
      rollupAddress: string;
    }
  };
  etherlink: {
    toolkit: Web3;
    bridgeOptions: {
      kernelAddress: string;
      withdrawPrecompileAddress: string;
    }
  };
  bridgeDataProvider: BridgeDataProvider
}
