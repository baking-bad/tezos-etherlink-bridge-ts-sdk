import type { TezosToolkit } from '@taquito/taquito';
import type Web3 from 'web3';

import type { TokenPair } from './bridgeCore';
import {
  DipDupBridgeDataProvider, LocalTokensBridgeDataProvider,
  type TokensBridgeDataProvider, type DipDupBridgeDataProviderOptions
} from './bridgeDataProviders';
import { LogLevel, loggerProvider, type Logger } from './logging';
import { TokenBridge } from './tokenBridge/tokenBridge';
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

interface LoggingOptions {
  logger?: Logger
  logLevel?: LogLevel
}

export interface DefaultTokenBridgeOptions {
  tezos: DefaultTezosTokenBridgeOptions;
  etherlink: DefaultEtherlinkTokenBridgeOptions;
  tokenPairs: TokensBridgeDataProvider | ReadonlyArray<Readonly<TokenPair>>;
  dipDup: DefaultDipDupBridgeDataProvider;
  logging?: LoggingOptions;
}

export const defaultEtherlinkKernelAddress = '0x0000000000000000000000000000000000000000';
export const defaultEtherlinkWithdrawPrecompileAddress = '0x0000000000000000000000000000000000000040';

export const createDefaultTokenBridge = (options: DefaultTokenBridgeOptions): TokenBridge => {
  if (options.logging) {
    options.logging.logger && loggerProvider.setLogger(options.logging.logger);
    options.logging.logLevel && loggerProvider.setLogLevel(options.logging.logLevel);
  }
  loggerProvider.logger.debug('Creating the default token bridge...');

  const dipDup = new DipDupBridgeDataProvider(options.dipDup);
  const tokensProvider = guards.isReadonlyArray(options.tokenPairs)
    ? new LocalTokensBridgeDataProvider(options.tokenPairs)
    : options.tokenPairs;

  const tokenBridge = new TokenBridge({
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

  loggerProvider.logger.debug('The default token bridge has been created');

  return tokenBridge;
};
