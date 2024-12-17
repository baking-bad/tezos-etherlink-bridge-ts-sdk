import type { NativeEtherlinkToken, NativeTezosToken, ERC20EtherlinkToken, FA12TezosToken, FA2TezosToken } from '../src';

export interface TestTokens {
  readonly tezos: {
    tez: NativeTezosToken;
    tzbtc: FA12TezosToken;
    usdt: FA2TezosToken;
  };
  readonly etherlink: {
    tez: NativeEtherlinkToken
    tzbtc: ERC20EtherlinkToken;
    usdt: ERC20EtherlinkToken;
  };
}

export interface TestConfig {
  readonly tezosRpcUrl: string;
  readonly etherlinkRpcUrl: string;
  readonly dipDupBaseUrl: string;
  readonly tzKTApiBaseUrl: string;
  readonly tezosRollupAddress: string;
  readonly etherlinkKernelAddress: string;
  readonly etherlinkWithdrawPrecompileAddress: string;
  readonly tezosAccountPrivateKey: string;
  readonly etherlinkAccountPrivateKey: string;
  readonly tokens: TestTokens;
}

const envInfos = [
  ['TEZOS_RPC_URL', 'the RPC URL for Tezos'],
  ['ETHERLINK_RPC_URL', 'the RPC URL for Etherlink'],
  ['DIPDUP_BASE_URL', 'the base URL of the DipDup Bridge Data Provider'],
  ['TZKT_API_BASE_URL', 'the base URL of the TzKT API'],
  ['TEZOS_ACCOUNT_PRIVATE_KEY', 'the private key of the test Tezos account'],
  ['ETHERLINK_ACCOUNT_PRIVATE_KEY', 'the private key of the test Etherlink account'],
  ['TEZOS_ROLLUP_ADDRESS', 'the address of the Bridge Rollup in Tezos'],
  ['ETHERLINK_KERNEL_ADDRESS', 'the kernel address of Etherlink'],
  ['ETHERLINK_WITHDRAW_PRECOMPILE_ADDRESS', 'the address of withdrawals in Etherlink'],
] as const;

const validateRequiredEnvironmentVariables = (): [true, typeof process.env & Record<typeof envInfos[number][0], string>] | [false, string[]] => {
  const errors: string[] = [];
  for (const [name, description] of envInfos) {
    if (!process.env[name])
      errors.push(`Please, specify \x1b[34m${name}\x1b[0m - ${description}`);
  }

  return errors.length ? [false, errors] : [true, process.env as any];
};

const createInvalidEnvironmentVariablesError = (errors: string[]): Error =>
  new Error(errors.reduce(
    (acc, error, index) => `  ${acc}${index + 1}. ${error}\n`,
    '\nSome required environment variables are invalid:\n'
  ));

const createTestTokens = (): TestTokens => {
  return {
    tezos: {
      tez: {
        type: 'native'
      },
      tzbtc: {
        type: 'fa1.2',
        address: 'KT1HmyazXfKDbo8XjwtWPXcoyHcmNPDCvZyb'
      },
      usdt: {
        type: 'fa2',
        address: 'KT1V2ak1MfNd3w4oyKD64ehYU7K4CrpUcDGR',
        tokenId: '0'
      }
    },
    etherlink: {
      tez: {
        type: 'native'
      },
      tzbtc: {
        type: 'erc20',
        address: '0x8e73aE3CF688Fbd8368c99520d26F9eF1B4d3BCa'
      },
      usdt: {
        type: 'erc20',
        address: '0xf68997eCC03751cb99B5B36712B213f11342452b'
      }
    }
  };
};

export const getTestConfig = (): TestConfig => {
  const [isValid, env] = validateRequiredEnvironmentVariables();
  if (!isValid)
    throw createInvalidEnvironmentVariablesError(env);

  const tokens = createTestTokens();

  return {
    tezosRpcUrl: env.TEZOS_RPC_URL,
    etherlinkRpcUrl: env.ETHERLINK_RPC_URL,
    dipDupBaseUrl: env.DIPDUP_BASE_URL,
    tzKTApiBaseUrl: env.TZKT_API_BASE_URL,
    tezosAccountPrivateKey: env.TEZOS_ACCOUNT_PRIVATE_KEY,
    etherlinkAccountPrivateKey: env.ETHERLINK_ACCOUNT_PRIVATE_KEY,
    tezosRollupAddress: env.TEZOS_ROLLUP_ADDRESS,
    etherlinkKernelAddress: env.ETHERLINK_KERNEL_ADDRESS,
    etherlinkWithdrawPrecompileAddress: env.ETHERLINK_WITHDRAW_PRECOMPILE_ADDRESS,
    tokens
  };
};
