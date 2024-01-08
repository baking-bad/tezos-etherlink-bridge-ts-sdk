import type { TezosToolkit } from '@taquito/taquito';
import type Web3 from 'web3';

import type { Network } from './common';
import type { RollupAddress } from './tezos';

export interface TokenBridgeOptions {
  network: Network;
  tezos: {
    toolkit: TezosToolkit;
    bridgeOptions: {
      rollupAddress: RollupAddress;
    }
  };
  etherlink: {
    toolkit: Web3;
    bridgeOptions: {
      kernelContractAddress: string;
    }
  };
}
