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

  test('Withdraw native token', async () => {
    const amount = 1n * (10n ** 18n);
    const [tezosToken, etherlinkToken] = [tokens.tezos.tez, tokens.etherlink.tez];

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
      createdBridgeTokenWithdrawal,
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

  test('Withdraw FA1.2 token', async () => {
    const amount = 1_700_000n;
    const [tezosToken, etherlinkToken] = [tokens.tezos.tzbtc, tokens.etherlink.tzbtc];

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
      createdBridgeTokenWithdrawal,
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
    const amount = 20_000_000n;
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
      createdBridgeTokenWithdrawal,
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

  test.skip('Withdraw FA1.2 token, check the transfer status using events (subscribeToTokenTransfer)', done => {
    const amount = 3_000_000n;
    const [tezosToken, etherlinkToken] = [tokens.tezos.tzbtc, tokens.etherlink.tzbtc];
    let readyForDone = false;

    tokenBridge.addEventListener('tokenTransferCreated', tokenTransfer => {
      expectPendingWithdrawal(tokenTransfer, {
        amount,
        source: testEtherlinkAccountAddress,
        receiver: testTezosAccountAddress,
        etherlinkToken
      });
      readyForDone = true;
    });

    tokenBridge.addEventListener('tokenTransferUpdated', tokenTransfer => {
      switch (tokenTransfer.status) {
        case BridgeTokenTransferStatus.Created:
          expectCreatedWithdrawal(tokenTransfer, {
            amount,
            source: testEtherlinkAccountAddress,
            receiver: testTezosAccountAddress,
            etherlinkToken,
          });

          break;
        case BridgeTokenTransferStatus.Sealed: {
          expectSealedWithdrawal(tokenTransfer, {
            amount,
            source: testEtherlinkAccountAddress,
            receiver: testTezosAccountAddress,
            etherlinkToken
          });
          tokenBridge.finishWithdraw(tokenTransfer);

          break;
        }
        case BridgeTokenTransferStatus.Finished: {
          expectFinishedWithdrawal(tokenTransfer, {
            inAmount: amount,
            outAmount: amount,
            source: testEtherlinkAccountAddress,
            receiver: testTezosAccountAddress,
            tezosToken,
            etherlinkToken
          });
          if (!readyForDone) {
            fail('The tokenTransferCreated event has not been fired.');
          }

          done();
          break;
        }
      }
    });

    tokenBridge.startWithdraw(amount, etherlinkToken)
      .then(result => tokenBridge.stream.subscribeToOperationTokenTransfers(result.tokenTransfer));

  }, withdrawalTimeout);
});
