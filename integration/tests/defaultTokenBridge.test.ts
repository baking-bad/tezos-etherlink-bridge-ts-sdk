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
  expectFinishedDeposit
} from '../testHelpers';

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
            type: 'native',
            ticketerContractAddress: 'KT1XsAj9z2DX2LLrq6bTRJBDubrME2auietW'
          },
          etherlink: {
            type: 'native'
          }
        },
        {
          tezos: {
            ...tokens.tezos.ctez,
            ticketerContractAddress: 'KT1PmYUomF3HDxsGWYQUCbLi2X8WvT7ZHv8o',
            tickerHelperContractAddress: 'KT1TZg9EwGHKbfWvsHGsqBjm3J5NhJBtHPKX'
          },
          etherlink: {
            ...tokens.etherlink.ctez,
          }
        },
        {
          tezos: {
            ...tokens.tezos.usdt,
            ticketerContractAddress: 'KT1GQEybCQffb6YJ5NH9GhPEeRyufrYP3amN',
            tickerHelperContractAddress: 'KT1LstLU529PtDUQHo2x8WybNXBzLXnF6Tkv'
          },
          etherlink: {
            ...tokens.etherlink.usdt,
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

  describe('Deposit', () => {
    test.skip('Deposit native token', async () => {
      const amount = 10_000_000n;
      const [tezosToken, etherlinkToken]: [NativeTezosToken, NativeEtherlinkToken] = [{ type: 'native' }, { type: 'native' }];

      const depositResult = await tokenBridge.deposit(tezosToken, amount);
      expectPendingDeposit(depositResult.tokenTransfer, {
        amount,
        source: testTezosAccountAddress,
        receiver: testEtherlinkAccountAddress,
        tezosToken,
        etherlinkToken
      });

      const finishedBridgeTokenDeposit = await tokenBridge.waitBridgeTokenTransferStatus(
        depositResult.tokenTransfer,
        BridgeTokenTransferStatus.Finished
      );

      expectFinishedDeposit(finishedBridgeTokenDeposit, {
        amount,
        source: testTezosAccountAddress,
        receiver: testEtherlinkAccountAddress,
        tezosToken,
        etherlinkToken,
        etherlinkKernelAddress: testConfig.etherlinkKernelAddress
      });
    });

    test('Deposit FA1.2 token', async () => {
      const amount = 7n;
      const [tezosToken, etherlinkToken] = [tokens.tezos.ctez, tokens.etherlink.ctez];

      const depositResult = await tokenBridge.deposit(tezosToken, amount);
      expectPendingDeposit(depositResult.tokenTransfer, {
        amount,
        source: testTezosAccountAddress,
        receiver: testEtherlinkAccountAddress,
        tezosToken,
        etherlinkToken
      });

      const finishedBridgeTokenDeposit = await tokenBridge.waitBridgeTokenTransferStatus(
        depositResult.tokenTransfer,
        BridgeTokenTransferStatus.Finished
      );

      expectFinishedDeposit(finishedBridgeTokenDeposit, {
        amount,
        source: testTezosAccountAddress,
        receiver: testEtherlinkAccountAddress,
        tezosToken,
        etherlinkToken,
        etherlinkKernelAddress: testConfig.etherlinkKernelAddress
      });
    });

    test.skip('Deposit FA2 token', async () => {
      const amount = 20n;
      const [tezosToken, etherlinkToken] = [tokens.tezos.usdt, tokens.etherlink.usdt];

      const depositResult = await tokenBridge.deposit(tezosToken, amount);
      expectPendingDeposit(depositResult.tokenTransfer, {
        amount,
        source: testTezosAccountAddress,
        receiver: testEtherlinkAccountAddress,
        tezosToken,
        etherlinkToken
      });

      const finishedBridgeTokenDeposit = await tokenBridge.waitBridgeTokenTransferStatus(
        depositResult.tokenTransfer,
        BridgeTokenTransferStatus.Finished
      );

      expectFinishedDeposit(finishedBridgeTokenDeposit, {
        amount,
        source: testTezosAccountAddress,
        receiver: testEtherlinkAccountAddress,
        tezosToken,
        etherlinkToken,
        etherlinkKernelAddress: testConfig.etherlinkKernelAddress
      });
    });

    test('Deposit FA1.2 token, check the transfer status using events', done => {
      const amount = 7n;
      const [tezosToken, etherlinkToken] = [tokens.tezos.ctez, tokens.etherlink.ctez];
      let readyForDone = false;

      tokenBridge.events.tokenTransferCreated.addListener(tokenTransfer => {
        expectPendingDeposit(tokenTransfer, {
          amount,
          source: testTezosAccountAddress,
          receiver: testEtherlinkAccountAddress,
          tezosToken,
          etherlinkToken
        });
        readyForDone = true;
      });

      tokenBridge.events.tokenTransferUpdated.addListener(tokenTransfer => {
        expectFinishedDeposit(tokenTransfer, {
          amount,
          source: testTezosAccountAddress,
          receiver: testEtherlinkAccountAddress,
          tezosToken,
          etherlinkToken,
          etherlinkKernelAddress: testConfig.etherlinkKernelAddress
        });
        if (!readyForDone) {
          fail('The tokenTransferCreated event has not been fired.');
        }

        done();
      });

      tokenBridge.deposit(tezosToken, amount)
        .then(result => tokenBridge.subscribeToTokenTransfer(result.tokenTransfer));
    });
  });
});
