import type { TezosToolkit } from '@taquito/taquito';
import type Web3 from 'web3';

import type {
  TokensBridgeDataProvider,
  BalancesBridgeDataProvider,
  TransfersBridgeDataProvider
} from '../bridgeDataProviders';

interface TezosTokenBridgeOptions {
  toolkit: TezosToolkit;
  bridgeOptions: {
    rollupAddress: string;
  }
}

interface EtherlinkTokenBridgeOptions {
  toolkit: Web3;
  bridgeOptions: {
    kernelAddress: string;
    withdrawPrecompileAddress: string;
  }
}

interface DataProvidersTokenBridgeOptions {
  tokens: TokensBridgeDataProvider;
  balances: BalancesBridgeDataProvider;
  transfers: TransfersBridgeDataProvider
}

export interface TokenBridgeOptions {
  tezos: TezosTokenBridgeOptions;
  etherlink: EtherlinkTokenBridgeOptions;
  bridgeDataProviders: DataProvidersTokenBridgeOptions;
}
