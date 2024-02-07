import { TezosToolkit } from '@taquito/taquito';
import Web3 from 'web3';

import {
  BridgeTokenTransferStatus,
  createDefaultTokenBridge,
  NativeEtherlinkToken,
  NativeTezosToken,
  type TokenBridge
} from '../../src';
import { getTestConfig, type TestConfig, type TestTokens } from '../testConfig';
import {
  createTezosToolkitWithSigner, createEtherlinkToolkitWithSigner,
  expectPendingDeposit,
  expectCreatedDeposit,
  expectFinishedDeposit,
  expectPendingWithdrawal,
  expectCreatedWithdrawal,
  expectSealedWithdrawal,
  expectFinishedWithdrawal
} from '../testHelpers';

// The Taquito Wallet API does not close some handles after tests complete.
const useWalletApi = false;
const withdrawTimeout = 15 * 60 * 1000;

describe('Bridge', () => {
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
    tokenBridge = createDefaultTokenBridge({
      tezos: {
        toolkit: tezosToolkit,
        rollupAddress: testConfig.tezosRollupAddress
      },
      etherlink: {
        toolkit: etherlinkToolkit
      },
      dipDup: {
        baseUrl: testConfig.dipDupBaseUrl,
        autoUpdate: {
          type: 'websocket',
          webSocketApiBaseUrl: testConfig.dipDupBaseUrl.replace('https', 'wss')
        }
      },
      tokenPairs: [
        {
          tezos: {
            token: { type: 'native' },
            ticketerContractAddress: 'KT1XsAj9z2DX2LLrq6bTRJBDubrME2auietW'
          },
          etherlink: {
            token: { type: 'native' }
          }
        },
        {
          tezos: {
            token: tokens.tezos.ctez,
            ticketerContractAddress: 'KT1PmYUomF3HDxsGWYQUCbLi2X8WvT7ZHv8o',
            tickerHelperContractAddress: 'KT1TZg9EwGHKbfWvsHGsqBjm3J5NhJBtHPKX'
          },
          etherlink: {
            token: tokens.etherlink.ctez
          }
        },
        {
          tezos: {
            token: tokens.tezos.usdt,
            ticketerContractAddress: 'KT1GQEybCQffb6YJ5NH9GhPEeRyufrYP3amN',
            tickerHelperContractAddress: 'KT1LstLU529PtDUQHo2x8WybNXBzLXnF6Tkv'
          },
          etherlink: {
            token: tokens.etherlink.usdt
          }
        }
      ]
    });

    const connectedAddresses = await Promise.all([
      await tokenBridge.getTezosConnectedAddress(),
      await tokenBridge.getEtherlinkConnectedAddress()
    ]);
    testTezosAccountAddress = connectedAddresses[0];
    testEtherlinkAccountAddress = connectedAddresses[1];

    await tokenBridge.start();
  });

  afterEach(() => {
    tokenBridge.stop();
  });

  describe('Deposit', () => {
    test.skip('Deposit native token', async () => {
      const amount = 10_000_000n;
      const [tezosToken, etherlinkToken]: [NativeTezosToken, NativeEtherlinkToken] = [{ type: 'native' }, { type: 'native' }];

      const depositResult = await tokenBridge.deposit(amount, tezosToken, { useWalletApi });
      expectPendingDeposit(depositResult.tokenTransfer, {
        amount,
        source: testTezosAccountAddress,
        receiver: testEtherlinkAccountAddress,
        tezosToken
      });

      const finishedBridgeTokenDeposit = await tokenBridge.waitForBridgeTokenTransferStatus(
        depositResult.tokenTransfer,
        BridgeTokenTransferStatus.Finished
      );

      expectFinishedDeposit(finishedBridgeTokenDeposit, {
        amount,
        source: testTezosAccountAddress,
        receiver: testEtherlinkAccountAddress,
        tezosToken,
        etherlinkToken
      });
    });

    test('Deposit FA1.2 token', async () => {
      const amount = 7n;
      const [tezosToken, etherlinkToken] = [tokens.tezos.ctez, tokens.etherlink.ctez];

      const depositResult = await tokenBridge.deposit(amount, tezosToken, { useWalletApi });
      expectPendingDeposit(depositResult.tokenTransfer, {
        amount,
        source: testTezosAccountAddress,
        receiver: testEtherlinkAccountAddress,
        tezosToken
      });

      const finishedBridgeTokenDeposit = await tokenBridge.waitForBridgeTokenTransferStatus(
        depositResult.tokenTransfer,
        BridgeTokenTransferStatus.Finished
      );

      expectFinishedDeposit(finishedBridgeTokenDeposit, {
        amount,
        source: testTezosAccountAddress,
        receiver: testEtherlinkAccountAddress,
        tezosToken,
        etherlinkToken
      });
    });

    test('Deposit FA2 token', async () => {
      const amount = 20n;
      const [tezosToken, etherlinkToken] = [tokens.tezos.usdt, tokens.etherlink.usdt];

      const depositResult = await tokenBridge.deposit(amount, tezosToken, { useWalletApi });
      expectPendingDeposit(depositResult.tokenTransfer, {
        amount,
        source: testTezosAccountAddress,
        receiver: testEtherlinkAccountAddress,
        tezosToken
      });

      const finishedBridgeTokenDeposit = await tokenBridge.waitForBridgeTokenTransferStatus(
        depositResult.tokenTransfer,
        BridgeTokenTransferStatus.Finished
      );

      expectFinishedDeposit(finishedBridgeTokenDeposit, {
        amount,
        source: testTezosAccountAddress,
        receiver: testEtherlinkAccountAddress,
        tezosToken,
        etherlinkToken
      });
    });

    test('Deposit FA1.2 token, check the transfer status using events', done => {
      const amount = 5n;
      const [tezosToken, etherlinkToken] = [tokens.tezos.ctez, tokens.etherlink.ctez];
      let readyForDone = false;

      tokenBridge.events.tokenTransferCreated.addListener(tokenTransfer => {
        expectPendingDeposit(tokenTransfer, {
          amount,
          source: testTezosAccountAddress,
          receiver: testEtherlinkAccountAddress,
          tezosToken
        });
        readyForDone = true;
      });

      tokenBridge.events.tokenTransferUpdated.addListener(tokenTransfer => {
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
            amount,
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

      tokenBridge.deposit(amount, tezosToken, { useWalletApi })
        .then(result => tokenBridge.subscribeToTokenTransfer(result.tokenTransfer));
    });

    test('Withdraw FA1.2 token', async () => {
      const amount = 7n;
      const [tezosToken, etherlinkToken] = [tokens.tezos.ctez, tokens.etherlink.ctez];

      const startWithdrawResult = await tokenBridge.startWithdraw(amount, etherlinkToken);
      expectPendingWithdrawal(startWithdrawResult.tokenTransfer, {
        amount,
        source: testEtherlinkAccountAddress,
        receiver: testTezosAccountAddress,
        etherlinkToken
      });

      const createdBridgeTokenWithdrawal = await tokenBridge.waitForBridgeTokenTransferStatus(
        startWithdrawResult.tokenTransfer,
        BridgeTokenTransferStatus.Created
      );
      expectCreatedWithdrawal(createdBridgeTokenWithdrawal, {
        amount,
        source: testEtherlinkAccountAddress,
        receiver: testTezosAccountAddress,
        etherlinkToken
      });

      const sealedBridgeTokenWithdrawal = await tokenBridge.waitForBridgeTokenTransferStatus(
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
      const finishedBridgeTokenWithdrawal = await tokenBridge.waitForBridgeTokenTransferStatus(
        finishWithdrawResult.tokenTransfer,
        BridgeTokenTransferStatus.Finished
      );
      expectFinishedWithdrawal(finishedBridgeTokenWithdrawal, {
        amount,
        source: testEtherlinkAccountAddress,
        receiver: testTezosAccountAddress,
        etherlinkToken,
        tezosToken
      });
    }, withdrawTimeout);

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

      const createdBridgeTokenWithdrawal = await tokenBridge.waitForBridgeTokenTransferStatus(
        startWithdrawResult.tokenTransfer,
        BridgeTokenTransferStatus.Created
      );
      expectCreatedWithdrawal(createdBridgeTokenWithdrawal, {
        amount,
        source: testEtherlinkAccountAddress,
        receiver: testTezosAccountAddress,
        etherlinkToken
      });

      const sealedBridgeTokenWithdrawal = await tokenBridge.waitForBridgeTokenTransferStatus(
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
      const finishedBridgeTokenWithdrawal = await tokenBridge.waitForBridgeTokenTransferStatus(
        finishWithdrawResult.tokenTransfer,
        BridgeTokenTransferStatus.Finished
      );
      expectFinishedWithdrawal(finishedBridgeTokenWithdrawal, {
        amount,
        source: testEtherlinkAccountAddress,
        receiver: testTezosAccountAddress,
        etherlinkToken,
        tezosToken
      });
    }, withdrawTimeout);
  });
});
