import { TezosToolkit } from '@taquito/taquito';
import Web3 from 'web3';

import { BridgeTokenTransferStatus, type TokenBridge } from '../../src';
import { getTestConfig, type TestConfig, type TestTokens } from '../testConfig';
import {
  createTezosToolkitWithSigner,
  createEtherlinkToolkitWithSigner,
  expectPendingWithdrawal,
  expectCreatedWithdrawal,
  expectSealedWithdrawal,
  expectFinishedWithdrawal,
  createTestTokenBridge
} from '../testHelpers';

const withdrawalTimeout = process.env.WITHDRAWAL_TIMEOUT ? parseInt(process.env.WITHDRAWAL_TIMEOUT, 10) : 15 * 60 * 1000;

describe('Withdrawal', () => {
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
      await tokenBridge.getTezosSignerAddress(),
      await tokenBridge.getEtherlinkSignerAddress()
    ]);
    testTezosAccountAddress = connectedAddresses[0]!;
    testEtherlinkAccountAddress = connectedAddresses[1]!;
  });

  afterEach(() => {
    tokenBridge[Symbol.dispose]();
  });

  test('Withdraw FA1.2 token', async () => {
    const amount = 17n;
    const [tezosToken, etherlinkToken] = [tokens.tezos.ctez, tokens.etherlink.ctez];

    const startWithdrawResult = await tokenBridge.startWithdraw(amount, etherlinkToken);
    expectPendingWithdrawal(startWithdrawResult.tokenTransfer, {
      amount,
      source: testEtherlinkAccountAddress,
      receiver: testTezosAccountAddress,
      etherlinkToken
    });

    const createdBridgeTokenWithdrawal = await tokenBridge.waitForStatus(
      startWithdrawResult.tokenTransfer,
      BridgeTokenTransferStatus.Created
    );
    expectCreatedWithdrawal(createdBridgeTokenWithdrawal, {
      amount,
      source: testEtherlinkAccountAddress,
      receiver: testTezosAccountAddress,
      etherlinkToken
    });

    const sealedBridgeTokenWithdrawal = await tokenBridge.waitForStatus(
      startWithdrawResult.tokenTransfer,
      BridgeTokenTransferStatus.Sealed
    );
    expectSealedWithdrawal(sealedBridgeTokenWithdrawal, {
      amount,
      source: testEtherlinkAccountAddress,
      receiver: testTezosAccountAddress,
      etherlinkToken
    });

    const finishWithdrawResult = await tokenBridge.finishWithdraw(sealedBridgeTokenWithdrawal);
    const finishedBridgeTokenWithdrawal = await tokenBridge.waitForStatus(
      finishWithdrawResult.tokenTransfer,
      BridgeTokenTransferStatus.Finished
    );
    expectFinishedWithdrawal(finishedBridgeTokenWithdrawal, {
      inAmount: amount,
      outAmount: amount,
      source: testEtherlinkAccountAddress,
      receiver: testTezosAccountAddress,
      etherlinkToken,
      tezosToken
    });
  }, withdrawalTimeout);

  test('Withdraw FA2 token', async () => {
    const amount = 20n;
    const [tezosToken, etherlinkToken] = [tokens.tezos.usdt, tokens.etherlink.usdt];

    const startWithdrawResult = await tokenBridge.startWithdraw(amount, etherlinkToken);
    expectPendingWithdrawal(startWithdrawResult.tokenTransfer, {
      amount,
      source: testEtherlinkAccountAddress,
      receiver: testTezosAccountAddress,
      etherlinkToken
    });

    const createdBridgeTokenWithdrawal = await tokenBridge.waitForStatus(
      startWithdrawResult.tokenTransfer,
      BridgeTokenTransferStatus.Created
    );
    expectCreatedWithdrawal(createdBridgeTokenWithdrawal, {
      amount,
      source: testEtherlinkAccountAddress,
      receiver: testTezosAccountAddress,
      etherlinkToken
    });

    const sealedBridgeTokenWithdrawal = await tokenBridge.waitForStatus(
      startWithdrawResult.tokenTransfer,
      BridgeTokenTransferStatus.Sealed
    );
    expectSealedWithdrawal(sealedBridgeTokenWithdrawal, {
      amount,
      source: testEtherlinkAccountAddress,
      receiver: testTezosAccountAddress,
      etherlinkToken
    });

    const finishWithdrawResult = await tokenBridge.finishWithdraw(sealedBridgeTokenWithdrawal);
    const finishedBridgeTokenWithdrawal = await tokenBridge.waitForStatus(
      finishWithdrawResult.tokenTransfer,
      BridgeTokenTransferStatus.Finished
    );
    expectFinishedWithdrawal(finishedBridgeTokenWithdrawal, {
      inAmount: amount,
      outAmount: amount,
      source: testEtherlinkAccountAddress,
      receiver: testTezosAccountAddress,
      etherlinkToken,
      tezosToken
    });
  }, withdrawalTimeout);
});
