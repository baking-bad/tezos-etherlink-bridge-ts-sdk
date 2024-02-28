import type { TezosToolkit } from '@taquito/taquito';
import type Web3 from 'web3';

import {
  TaquitoContractTezosBridgeBlockchainService,
  TaquitoWalletTezosBridgeBlockchainService,
  Web3EtherlinkBridgeBlockchainService,
} from './bridgeBlockchainService';
import type { TokenPair } from './bridgeCore';
import { DefaultDataProvider, type DefaultDataProviderOptions, type TokensBridgeDataProvider } from './bridgeDataProviders';
import { LogLevel, loggerProvider, type Logger } from './logging';
import { TokenBridge } from './tokenBridge';

interface TaquitoTezosBridgeBlockchainServiceOptionsBase {
  name: 'taquito';
  tezosToolkit: TezosToolkit;
  smartRollupAddress: string;
}

interface TaquitoContractTezosBridgeBlockchainServiceOptions extends TaquitoTezosBridgeBlockchainServiceOptionsBase {
  apiType: 'contract';
}

interface TaquitoWalletTezosBridgeBlockchainServiceOptions extends TaquitoTezosBridgeBlockchainServiceOptionsBase {
  apiType: 'wallet';
}

type TezosBridgeBlockchainServiceOptions =
  | TaquitoContractTezosBridgeBlockchainServiceOptions
  | TaquitoWalletTezosBridgeBlockchainServiceOptions;

interface EtherlinkWeb3BridgeBlockchainServiceOptions {
  name: 'web3';
  web3: Web3;
}

type EtherlinkBridgeBlockchainServiceOptions = EtherlinkWeb3BridgeBlockchainServiceOptions;

interface LoggingOptions {
  logger?: Logger
  logLevel?: LogLevel
}

export type DefaultTokenBridgeOptions<
  TTezosBridgeBlockchainServiceOptions extends TezosBridgeBlockchainServiceOptions = TezosBridgeBlockchainServiceOptions,
  TEtherlinkBridgeBlockchainServiceOptions extends EtherlinkBridgeBlockchainServiceOptions = EtherlinkBridgeBlockchainServiceOptions
> = {
  tezos: TTezosBridgeBlockchainServiceOptions;
  etherlink: TEtherlinkBridgeBlockchainServiceOptions;
  tokenPairs: TokensBridgeDataProvider | ReadonlyArray<Readonly<TokenPair>>;
  logging?: LoggingOptions;
} & DefaultDataProviderOptions;

export const defaultEtherlinkKernelAddress = '0x0000000000000000000000000000000000000000';
export const defaultWithdrawNativeTokenPrecompileAddress = '0x0000000000000000000000000000000000000020';
export const defaultWithdrawNonNativeTokenPrecompileAddress = '0x0000000000000000000000000000000000000040';

const createTezosBridgeBlockchainService = (options: DefaultTokenBridgeOptions['tezos']) => {
  switch (options.name) {
    case 'taquito':
      switch (options.apiType) {
        case 'contract':
          return new TaquitoContractTezosBridgeBlockchainService({
            tezosToolkit: options.tezosToolkit,
            smartRollupAddress: options.smartRollupAddress,
          });
        case 'wallet':
          return new TaquitoWalletTezosBridgeBlockchainService({
            tezosToolkit: options.tezosToolkit,
            smartRollupAddress: options.smartRollupAddress,
          });
        default:
          throw new Error(`Unknown Taquito API type: ${(options as any).apiType}`);
      }
    default:
      throw new Error(`Unknown service name: ${options.name}`);
  }
};

const createEtherlinkBridgeBlockchainService = (options: DefaultTokenBridgeOptions['etherlink']) => {
  switch (options.name) {
    case 'web3':
      return new Web3EtherlinkBridgeBlockchainService({
        web3: options.web3,
        kernelAddress: defaultEtherlinkKernelAddress,
        withdrawNativeTokenPrecompileAddress: defaultWithdrawNativeTokenPrecompileAddress,
        withdrawNonNativeTokenPrecompileAddress: defaultWithdrawNonNativeTokenPrecompileAddress
      });
    default:
      throw new Error(`Unknown service name: ${options.name}`);
  }
};

type MapTezosOptionsToService<Options> = Options extends TaquitoContractTezosBridgeBlockchainServiceOptions
  ? TaquitoContractTezosBridgeBlockchainService
  : Options extends TaquitoWalletTezosBridgeBlockchainServiceOptions
  ? TaquitoWalletTezosBridgeBlockchainService
  : never;

type MapEtherlinkOptionsToService<Options> = Options extends EtherlinkWeb3BridgeBlockchainServiceOptions
  ? Web3EtherlinkBridgeBlockchainService
  : never;

export const createDefaultTokenBridge = <
  TOptions extends TezosBridgeBlockchainServiceOptions,
  EOptions extends EtherlinkBridgeBlockchainServiceOptions
>(options: DefaultTokenBridgeOptions<TOptions, EOptions>): TokenBridge<MapTezosOptionsToService<TOptions>, MapEtherlinkOptionsToService<EOptions>> => {
  if (options.logging) {
    options.logging.logger && loggerProvider.setLogger(options.logging.logger);
    options.logging.logLevel && loggerProvider.setLogLevel(options.logging.logLevel);
  }
  loggerProvider.logger.debug('Creating the default token bridge...');

  const tezosBridgeBlockchainService = createTezosBridgeBlockchainService(options.tezos);
  const etherlinkBridgeBlockchainService = createEtherlinkBridgeBlockchainService(options.etherlink);

  const defaultDataProvider = new DefaultDataProvider(options);
  const tokenBridge = new TokenBridge({
    tezosBridgeBlockchainService,
    etherlinkBridgeBlockchainService,
    bridgeDataProviders: {
      tokens: defaultDataProvider,
      balances: defaultDataProvider,
      transfers: defaultDataProvider
    }
  });

  loggerProvider.logger.debug('The default token bridge has been created');

  return tokenBridge as TokenBridge<MapTezosOptionsToService<TOptions>, MapEtherlinkOptionsToService<EOptions>>;
};
