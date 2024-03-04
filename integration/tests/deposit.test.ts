import { TezosToolkit } from '@taquito/taquito';
import Web3 from 'web3';

import {
  BridgeTokenTransferStatus,
  type NativeEtherlinkToken, type NativeTezosToken
} from '../../src';
import { bridgeUtils } from '../../src/utils';
import { getTestConfig, type TestConfig, type TestTokens } from '../testConfig';
import {
  createTezosToolkitWithSigner,
  createEtherlinkToolkitWithSigner,
  expectPendingDeposit,
  expectCreatedDeposit,
  expectFinishedDeposit,
  createTestTokenBridge
} from '../testHelpers';

describe('Deposit', () => {
  let testConfig: TestConfig;
  let tokens: TestTokens;
  let tezosToolkit: TezosToolkit;
  let etherlinkToolkit: Web3;
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

  test('Deposit native token', async () => {
    const amount = 1_000_000n;
    const [tezosToken, etherlinkToken]: [NativeTezosToken, NativeEtherlinkToken] = [tokens.tezos.tez, tokens.etherlink.tez];

    const depositResult = await tokenBridge.deposit(amount, tezosToken);
    expectPendingDeposit(depositResult.tokenTransfer, {
      amount,
      source: testTezosAccountAddress,
      receiver: testEtherlinkAccountAddress,
      tezosToken
    });

    const finishedBridgeTokenDeposit = await tokenBridge.waitForStatus(
      depositResult.tokenTransfer,
      BridgeTokenTransferStatus.Finished
    );

    expectFinishedDeposit(finishedBridgeTokenDeposit, {
      inAmount: amount,
      outAmount: amount * 1_000_000_000_000n,
      source: testTezosAccountAddress,
      receiver: testEtherlinkAccountAddress,
      tezosToken,
      etherlinkToken
    });
  });

  test('Deposit FA1.2 token', async () => {
    const amount = 7n;
    const [tezosToken, etherlinkToken] = [tokens.tezos.ctez, tokens.etherlink.ctez];

    const depositResult = await tokenBridge.deposit(amount, tezosToken);
    expectPendingDeposit(depositResult.tokenTransfer, {
      amount,
      source: testTezosAccountAddress,
      receiver: testEtherlinkAccountAddress,
      tezosToken
    });

    const finishedBridgeTokenDeposit = await tokenBridge.waitForStatus(
      depositResult.tokenTransfer,
      BridgeTokenTransferStatus.Finished
    );

    expectFinishedDeposit(finishedBridgeTokenDeposit, {
      inAmount: amount,
      outAmount: amount,
      source: testTezosAccountAddress,
      receiver: testEtherlinkAccountAddress,
      tezosToken,
      etherlinkToken
    });
  });

  test('Deposit FA2 token', async () => {
    const amount = 20n;
    const [tezosToken, etherlinkToken] = [tokens.tezos.usdt, tokens.etherlink.usdt];

    const depositResult = await tokenBridge.deposit(amount, tezosToken);
    expectPendingDeposit(depositResult.tokenTransfer, {
      amount,
      source: testTezosAccountAddress,
      receiver: testEtherlinkAccountAddress,
      tezosToken
    });

    const finishedBridgeTokenDeposit = await tokenBridge.waitForStatus(
      depositResult.tokenTransfer,
      BridgeTokenTransferStatus.Finished
    );

    expectFinishedDeposit(finishedBridgeTokenDeposit, {
      inAmount: amount,
      outAmount: amount,
      source: testTezosAccountAddress,
      receiver: testEtherlinkAccountAddress,
      tezosToken,
      etherlinkToken
    });
  });

  test('Deposit FA1.2 token, check the transfer status using events (subscribeToTokenTransfer)', done => {
    const amount = 5n;
    const [tezosToken, etherlinkToken] = [tokens.tezos.ctez, tokens.etherlink.ctez];
    let readyForDone = false;

    tokenBridge.addEventListener('tokenTransferCreated', tokenTransfer => {
      expectPendingDeposit(tokenTransfer, {
        amount,
        source: testTezosAccountAddress,
        receiver: testEtherlinkAccountAddress,
        tezosToken
      });
      readyForDone = true;
    });

    tokenBridge.addEventListener('tokenTransferUpdated', tokenTransfer => {
      if (tokenTransfer.status === BridgeTokenTransferStatus.Created) {
        expectCreatedDeposit(tokenTransfer, {
          amount,
          source: testTezosAccountAddress,
          receiver: testEtherlinkAccountAddress,
          tezosToken,
        });
      }
      else if (tokenTransfer.status === BridgeTokenTransferStatus.Finished) {
        expectFinishedDeposit(tokenTransfer, {
          inAmount: amount,
          outAmount: amount,
          source: testTezosAccountAddress,
          receiver: testEtherlinkAccountAddress,
          tezosToken,
          etherlinkToken
        });
        if (!readyForDone) {
          fail('The tokenTransferCreated event has not been fired.');
        }

        done();
      }
    });

    tokenBridge.deposit(amount, tezosToken)
      .then(result => tokenBridge.stream.subscribeToTokenTransfer(result.tokenTransfer));
  });

  test('Deposit FA1.2 token, check the transfer status using events (subscribeToAccountTransfers)', done => {
    const amount = 5n;
    const [tezosToken, etherlinkToken] = [tokens.tezos.ctez, tokens.etherlink.ctez];
    let readyForDone = false;
    let tokenTransferOperationHash: string | undefined;

    tokenBridge.addEventListener('tokenTransferCreated', tokenTransfer => {
      if (bridgeUtils.getInitialOperationHash(tokenTransfer) !== tokenTransferOperationHash)
        return;

      expectPendingDeposit(tokenTransfer, {
        amount,
        source: testTezosAccountAddress,
        receiver: testEtherlinkAccountAddress,
        tezosToken
      });
      readyForDone = true;
    });

    tokenBridge.addEventListener('tokenTransferUpdated', tokenTransfer => {
      if (bridgeUtils.getInitialOperationHash(tokenTransfer) !== tokenTransferOperationHash)
        return;

      if (tokenTransfer.status === BridgeTokenTransferStatus.Created) {
        expectCreatedDeposit(tokenTransfer, {
          amount,
          source: testTezosAccountAddress,
          receiver: testEtherlinkAccountAddress,
          tezosToken,
        });
      }
      else if (tokenTransfer.status === BridgeTokenTransferStatus.Finished) {
        expectFinishedDeposit(tokenTransfer, {
          inAmount: amount,
          outAmount: amount,
          source: testTezosAccountAddress,
          receiver: testEtherlinkAccountAddress,
          tezosToken,
          etherlinkToken
        });
        if (!readyForDone) {
          done('The tokenTransferCreated event has not been fired.');
        }

        done();
      }
    });

    tokenBridge.stream.subscribeToAccountTokenTransfers([testTezosAccountAddress, testEtherlinkAccountAddress]);

    tokenBridge.deposit(amount, tezosToken)
      .then(depositResult => {
        tokenTransferOperationHash = depositResult.operationResult.hash;
      });
  });
});
