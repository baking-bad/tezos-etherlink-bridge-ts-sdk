import type { TezosToolkit } from '@taquito/taquito';

export interface TezosBlockchainBridgeComponentOptions {
  tezosToolkit: TezosToolkit;
  rollupAddress: string;
}
