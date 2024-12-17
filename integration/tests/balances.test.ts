import { TezosToolkit } from '@taquito/taquito';

import type { AccountTokenBalance, AccountTokenBalances } from '../../src';
import { getTestConfig, type TestConfig, type TestTokens } from '../testConfig';
import { createTezosToolkitWithSigner, createEtherlinkToolkitWithSigner, createTestTokenBridge, type EtherlinkToolkit } from '../testHelpers';

describe('Balances', () => {
  let testConfig: TestConfig;
  let tokens: TestTokens;
  let tezosToolkit: TezosToolkit;
  let etherlinkToolkit: EtherlinkToolkit;
  let tokenBridge: ReturnType<typeof createTestTokenBridge>;
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
      await tokenBridge.getTezosSignerAddress(),
      await tokenBridge.getEtherlinkSignerAddress()
    ]);
    testTezosAccountAddress = connectedAddresses[0]!;
    testEtherlinkAccountAddress = connectedAddresses[1]!;
  });

  afterEach(() => {
    tokenBridge[Symbol.dispose]();
  });

  test.each([
    () => [testTezosAccountAddress, tokens.tezos.tez] as const,
    () => [testTezosAccountAddress, tokens.tezos.tzbtc] as const,
    () => [testTezosAccountAddress, tokens.tezos.usdt] as const,
    () => [testEtherlinkAccountAddress, tokens.etherlink.tez] as const,
    () => [testEtherlinkAccountAddress, tokens.etherlink.tzbtc] as const,
    () => [testEtherlinkAccountAddress, tokens.etherlink.usdt] as const,
  ])('Get the balance for a specific address and token: %#', async getTestData => {
    const [address, token] = getTestData();

    const balancesInfo = await tokenBridge.data.getBalance(address, token);

    expect(balancesInfo).toMatchObject<AccountTokenBalance>({
      address,
      token,
      balance: expect.any(BigInt)
    });
  });

  test.each([
    () => [testTezosAccountAddress, [tokens.tezos.tez], [tokens.tezos.tez]] as const,
    () => [testTezosAccountAddress, [tokens.tezos.tzbtc], [tokens.tezos.tzbtc]] as const,
    () => [testTezosAccountAddress, [tokens.tezos.tzbtc, tokens.tezos.usdt], [tokens.tezos.tzbtc, tokens.tezos.usdt]] as const,
    () => [
      testTezosAccountAddress,
      [tokens.tezos.tzbtc, tokens.tezos.tez, tokens.tezos.usdt],
      [tokens.tezos.tez, tokens.tezos.tzbtc, tokens.tezos.usdt]
    ] as const,
    () => [
      testTezosAccountAddress,
      [tokens.tezos.tzbtc, tokens.etherlink.tzbtc, tokens.tezos.tez, tokens.tezos.usdt],
      [tokens.tezos.tzbtc, tokens.tezos.tez, tokens.tezos.usdt]
    ] as const,
    () => [
      testTezosAccountAddress,
      [tokens.tezos.tzbtc, tokens.etherlink.tzbtc, tokens.tezos.tez, tokens.etherlink.tez, tokens.tezos.usdt],
      [tokens.tezos.tzbtc, tokens.tezos.tez, tokens.tezos.usdt]
    ] as const,
    () => [testEtherlinkAccountAddress, [tokens.etherlink.tez], [tokens.etherlink.tez]] as const,
    () => [testEtherlinkAccountAddress, [tokens.etherlink.tzbtc], [tokens.etherlink.tzbtc]] as const,
    () => [testEtherlinkAccountAddress, [tokens.etherlink.tzbtc, tokens.etherlink.usdt], [tokens.etherlink.tzbtc, tokens.etherlink.usdt]] as const,
    () => [
      testEtherlinkAccountAddress,
      [tokens.etherlink.tzbtc, tokens.tezos.tzbtc, tokens.tezos.tez, tokens.etherlink.usdt],
      [tokens.etherlink.tzbtc, tokens.etherlink.tez, tokens.etherlink.usdt]
    ] as const,
  ])('Get the balance for a specific address and tokens: %#', async getTestData => {
    const [address, tokens, expectedTokens] = getTestData();

    const balancesInfo = await tokenBridge.data.getBalances(address, tokens);

    const expectedTokenBalances = expectedTokens.map(t => ({
      token: t,
      balance: expect.any(BigInt)
    }));
    expect(balancesInfo.tokenBalances.length).toEqual(expectedTokenBalances.length);
    expect(balancesInfo).toMatchObject<AccountTokenBalances>({
      address,
      tokenBalances: expect.arrayContaining(expectedTokenBalances)
    });
  });

  test('Get balances of the all tokens for the Tezos address', async () => {
    const address = testTezosAccountAddress;

    const balancesInfo = await tokenBridge.data.getBalances(address);

    expect(balancesInfo).toMatchObject<AccountTokenBalances>({
      address,
      tokenBalances: expect.arrayContaining([
        {
          token: tokens.tezos.tez,
          balance: expect.any(BigInt)
        },
        {
          token: tokens.tezos.tzbtc,
          balance: expect.any(BigInt)
        },
        {
          token: tokens.tezos.usdt,
          balance: expect.any(BigInt)
        }
      ])
    });
  });

  test('Get balances of the all tokens for the Etherlink address', async () => {
    const address = testEtherlinkAccountAddress;

    const balancesInfo = await tokenBridge.data.getBalances(address);

    expect(balancesInfo).toMatchObject<AccountTokenBalances>({
      address,
      tokenBalances: expect.arrayContaining([
        {
          token: tokens.etherlink.tez,
          balance: expect.any(BigInt)
        },
        {
          token: tokens.etherlink.tzbtc,
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
