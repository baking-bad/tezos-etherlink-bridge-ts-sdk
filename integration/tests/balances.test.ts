import { TezosToolkit } from '@taquito/taquito';
import Web3 from 'web3';

import { type TokenBridge, type AccountTokenBalanceInfo } from '../../src';
import { getTestConfig, type TestConfig, type TestTokens } from '../testConfig';
import {
  createTezosToolkitWithSigner, createEtherlinkToolkitWithSigner, createTestTokenBridge
} from '../testHelpers';

describe('Balances', () => {
  let testConfig: TestConfig;
  let tokens: TestTokens;
  let tezosToolkit: TezosToolkit;
  let etherlinkToolkit: Web3;
  let tokenBridge: TokenBridge;
  let testTezosAccountAddress: string;
  let testEtherlinkAccountAddress: string;

  beforeAll(() => {
    testConfig = getTestConfig();
    tokens = testConfig.tokens;
    tezosToolkit = createTezosToolkitWithSigner(testConfig.tezosRpcUrl, testConfig.tezosAccountPrivateKey);
    etherlinkToolkit = createEtherlinkToolkitWithSigner(testConfig.etherlinkRpcUrl, testConfig.etherlinkAccountPrivateKey);
  });

  beforeEach(async () => {
    tokenBridge = createTestTokenBridge({ testConfig, tezosToolkit, etherlinkToolkit });

    const connectedAddresses = await Promise.all([
      await tokenBridge.getTezosConnectedAddress(),
      await tokenBridge.getEtherlinkConnectedAddress()
    ]);
    testTezosAccountAddress = connectedAddresses[0];
    testEtherlinkAccountAddress = connectedAddresses[1];
  });

  afterEach(() => {
    tokenBridge[Symbol.dispose]();
  });

  test.each([
    // () => [testTezosAccountAddress, tokens.tezos.tez] as const,
    // () => [testTezosAccountAddress, tokens.tezos.ctez] as const,
    // () => [testTezosAccountAddress, tokens.tezos.usdt] as const,
    // () => [testEtherlinkAccountAddress, tokens.etherlink.tez] as const,
    () => [testEtherlinkAccountAddress, tokens.etherlink.ctez] as const,
    () => [testEtherlinkAccountAddress, tokens.etherlink.usdt] as const,
  ])('Get the balance for a specific address and token.', async getTestData => {
    const [address, token] = getTestData();

    const balancesInfo = await tokenBridge.data.getBalance(address, token);

    expect(balancesInfo).toMatchObject<AccountTokenBalanceInfo>({
      address,
      tokenBalances: [{
        token,
        balance: expect.any(BigInt)
      }]
    });
  });

  test.each([
    // () => testTezosAccountAddress,
    () => testEtherlinkAccountAddress
  ])('Get balances of the all tokens for a specific address', async getTestAddress => {
    const address = getTestAddress();

    const balancesInfo = await tokenBridge.data.getBalances(address);

    expect(balancesInfo).toMatchObject<AccountTokenBalanceInfo>({
      address,
      tokenBalances: expect.arrayContaining([
        {
          token: tokens.etherlink.ctez,
          balance: expect.any(BigInt)
        },
        {
          token: tokens.etherlink.usdt,
          balance: expect.any(BigInt)
        }
      ])
    });
  });
});
