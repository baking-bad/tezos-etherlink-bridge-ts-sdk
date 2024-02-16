import type { TezosToolkit } from '@taquito/taquito';
import type Web3 from 'web3';

import type { TokenPair } from './bridgeCore';
import { DefaultDataProvider, type DefaultDataProviderOptions, type TokensBridgeDataProvider } from './bridgeDataProviders';
import { LogLevel, loggerProvider, type Logger } from './logging';
import { TokenBridge } from './tokenBridge/tokenBridge';

interface DefaultTezosTokenBridgeOptions {
  toolkit: TezosToolkit;
  rollupAddress: string;
}

interface DefaultEtherlinkTokenBridgeOptions {
  toolkit: Web3;
}

interface LoggingOptions {
  logger?: Logger
  logLevel?: LogLevel
}

export type DefaultTokenBridgeOptions = {
  tezos: DefaultTezosTokenBridgeOptions;
  etherlink: DefaultEtherlinkTokenBridgeOptions;
  tokenPairs: TokensBridgeDataProvider | ReadonlyArray<Readonly<TokenPair>>;
  logging?: LoggingOptions;
} & DefaultDataProviderOptions;

export const defaultEtherlinkKernelAddress = '0x0000000000000000000000000000000000000000';
export const defaultEtherlinkWithdrawPrecompileAddress = '0x0000000000000000000000000000000000000040';

export const createDefaultTokenBridge = (options: DefaultTokenBridgeOptions): TokenBridge => {
  if (options.logging) {
    options.logging.logger && loggerProvider.setLogger(options.logging.logger);
    options.logging.logLevel && loggerProvider.setLogLevel(options.logging.logLevel);
  }
  loggerProvider.logger.debug('Creating the default token bridge...');

  const defaultDataProvider = new DefaultDataProvider(options);
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
      tokens: defaultDataProvider,
      balances: defaultDataProvider,
      transfers: defaultDataProvider
    }
  });

  loggerProvider.logger.debug('The default token bridge has been created');

  return tokenBridge;
};
