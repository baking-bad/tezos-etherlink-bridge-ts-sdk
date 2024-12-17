import { InMemorySigner } from '@taquito/signer';
import { TezosToolkit } from '@taquito/taquito';
import { ethers as ethers } from 'ethers';
import { ethers as ethersV5 } from 'ethers-v5';
import Web3 from 'web3';

import { TestConfig } from './testConfig';
import {
  loggerProvider,
  TokenBridge,
  TaquitoContractTezosBridgeBlockchainService,
  Web3EtherlinkBridgeBlockchainService,
  EthersV5EtherlinkBridgeBlockchainService,
  EthersEtherlinkBridgeBlockchainService,
  DefaultDataProvider,
  BridgeTokenTransferKind, BridgeTokenTransferStatus, LogLevel,
  type TezosToken, type EtherlinkToken,
  type BridgeTokenTransfer,
  type PendingBridgeTokenDeposit, type CreatedBridgeTokenDeposit, type FinishedBridgeTokenDeposit,
  type PendingBridgeTokenWithdrawal, type CreatedBridgeTokenWithdrawal,
  type SealedBridgeTokenWithdrawal, type FinishedBridgeTokenWithdrawal,
  type DefaultDataProviderOptions,
} from '../src';

const depositIdRegex = /^o[0-9a-zA-Z]{50}_\d+_\d+$/;
const withdrawalIdRegex = /^0x[0-9a-f]{64}_\d+$/;
const tezosOperationRegex = /^o[0-9a-zA-Z]{50}$/;
const etherlinkOperationRegex = /^0x[0-9a-f]{64}$/;

export type EtherlinkToolkit =
  | { type: 'web3', web3: Web3 }
  | { type: 'ethers-v6', ethers: typeof ethers, signer: ethers.Signer }
  | { type: 'ethers-v5', ethers: typeof ethersV5, signer: ethersV5.Signer };

interface CreateTestTokenBridgeParams {
  testConfig: TestConfig,
  tezosToolkit?: TezosToolkit,
  etherlinkToolkit?: EtherlinkToolkit,
  overriddenDefaultDataProviderOptions?: Partial<DefaultDataProviderOptions>
}

export const createTestTokenBridge = ({ testConfig, tezosToolkit, etherlinkToolkit, overriddenDefaultDataProviderOptions }: CreateTestTokenBridgeParams) => {
  tezosToolkit = tezosToolkit || createTezosToolkitWithSigner(testConfig.tezosRpcUrl, testConfig.tezosAccountPrivateKey);
  etherlinkToolkit = etherlinkToolkit || createEtherlinkToolkitWithSigner(testConfig.etherlinkRpcUrl, testConfig.etherlinkAccountPrivateKey);

  loggerProvider.setLogLevel(LogLevel.Debug);

  const defaultDataProvider = new DefaultDataProvider({
    dipDup: {
      baseUrl: testConfig.dipDupBaseUrl,
      webSocketApiBaseUrl: testConfig.dipDupBaseUrl.replace('https', 'wss'),
    },
    tzKTApiBaseUrl: testConfig.tzKTApiBaseUrl,
    etherlinkRpcUrl: testConfig.etherlinkRpcUrl,
    tokenPairs: [
      {
        tezos: {
          ...testConfig.tokens.tezos.tez,
          ticketHelperContractAddress: 'KT1VEjeQfDBSfpDH5WeBM5LukHPGM2htYEh3'
        },
        etherlink: {
          ...testConfig.tokens.etherlink.tez,
        }
      },
      {
        tezos: {
          ...testConfig.tokens.tezos.tzbtc,
          ticketerContractAddress: 'KT1H7if3gSZE1pZSK48W3NzGpKmbWyBxWDHe',
          ticketHelperContractAddress: 'KT1KUAaaRMeMS5TJJyGTQJANcpSR4egvHBUk'
        },
        etherlink: {
          ...testConfig.tokens.etherlink.tzbtc
        }
      },
      {
        tezos: {
          ...testConfig.tokens.tezos.usdt,
          ticketerContractAddress: 'KT1S6Nf9MnafAgSUWLKcsySPNFLUxxqSkQCw',
          ticketHelperContractAddress: 'KT1JLZe4qTa76y6Us2aDoRNUgZyssSDUr6F5'
        },
        etherlink: {
          ...testConfig.tokens.etherlink.usdt
        }
      },
    ],
    ...overriddenDefaultDataProviderOptions
  });

  return new TokenBridge({
    tezosBridgeBlockchainService: new TaquitoContractTezosBridgeBlockchainService({
      tezosToolkit,
      smartRollupAddress: testConfig.tezosRollupAddress
    }),
    etherlinkBridgeBlockchainService: etherlinkToolkit.type === 'web3'
      ? new Web3EtherlinkBridgeBlockchainService({
        web3: etherlinkToolkit.web3
      })
      : etherlinkToolkit.type === 'ethers-v6' ? new EthersEtherlinkBridgeBlockchainService({
        ethers: etherlinkToolkit.ethers,
        signer: etherlinkToolkit.signer
      })
        : new EthersV5EtherlinkBridgeBlockchainService({
          ethers: etherlinkToolkit.ethers,
          signer: etherlinkToolkit.signer
        }),
    bridgeDataProviders: {
      transfers: defaultDataProvider,
      balances: defaultDataProvider,
      tokens: defaultDataProvider,
    }
  });
};

export const createTezosToolkitWithSigner = (rpcUrl: string, privateKey: string): TezosToolkit => {
  const toolkit = new TezosToolkit(rpcUrl);

  toolkit.setProvider({
    signer: new InMemorySigner(privateKey),
  });

  return toolkit;
};

const createWeb3EtherlinkToolkitWithSigner = (rpcUrl: string, privateKey: string) => {
  const web3 = new Web3(rpcUrl);
  const account = web3.eth.accounts.privateKeyToAccount(privateKey);
  web3.eth.accounts.wallet.add(account);
  web3.eth.defaultAccount = account.address;

  return { type: 'web3', web3 } satisfies EtherlinkToolkit;
};

const createEthersEtherlinkToolkitWithSigner = (rpcUrl: string, privateKey: string) => {
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const wallet = new ethers.Wallet(privateKey, provider);

  return { type: 'ethers-v6', ethers, signer: wallet } satisfies EtherlinkToolkit;
};

const createEthersV5EtherlinkToolkitWithSigner = (rpcUrl: string, privateKey: string) => {
  const provider = new ethersV5.providers.JsonRpcProvider(rpcUrl);
  const wallet = new ethersV5.Wallet(privateKey, provider);

  return { type: 'ethers-v5', ethers: ethersV5, signer: wallet } satisfies EtherlinkToolkit;
};

export const createEtherlinkToolkitWithSigner = (rpcUrl: string, privateKey: string, type: EtherlinkToolkit['type'] = 'web3') => {
  if (!privateKey.startsWith('0x'))
    privateKey = '0x' + privateKey;

  switch (type) {
    case 'web3':
      return createWeb3EtherlinkToolkitWithSigner(rpcUrl, privateKey);
    case 'ethers-v6':
      return createEthersEtherlinkToolkitWithSigner(rpcUrl, privateKey);
    case 'ethers-v5':
      return createEthersV5EtherlinkToolkitWithSigner(rpcUrl, privateKey);
  }
};

export const expectPendingDeposit = (
  pendingBridgeTokenDeposit: BridgeTokenTransfer,
  params: {
    amount: bigint,
    tezosToken: TezosToken,
    source: string,
    receiver: string,
  }
) => {
  expect(pendingBridgeTokenDeposit).toMatchObject<PendingBridgeTokenDeposit>({
    kind: BridgeTokenTransferKind.Deposit,
    status: BridgeTokenTransferStatus.Pending,
    source: params.source,
    receiver: params.receiver,
    tezosOperation: {
      hash: expect.stringMatching(tezosOperationRegex),
      amount: params.amount,
      token: params.tezosToken,
      timestamp: expect.any(String),
    }
  });
};

export const expectCreatedDeposit = (
  createdBridgeTokenDeposit: BridgeTokenTransfer,
  params: {
    amount: bigint,
    tezosToken: TezosToken,
    source: string,
    receiver: string,
  }
) => {
  expect(createdBridgeTokenDeposit).toMatchObject<CreatedBridgeTokenDeposit>({
    id: expect.stringMatching(depositIdRegex),
    kind: BridgeTokenTransferKind.Deposit,
    status: BridgeTokenTransferStatus.Created,
    source: params.source,
    receiver: params.receiver,
    tezosOperation: {
      blockId: expect.any(Number),
      hash: expect.stringMatching(tezosOperationRegex),
      counter: expect.any(Number),
      nonce: expect.any(Number),
      amount: params.amount,
      token: params.tezosToken,
      timestamp: expect.any(String),
    }
  });
};

export const expectFinishedDeposit = (
  finishedBridgeTokenDeposit: BridgeTokenTransfer,
  params: {
    inAmount: bigint,
    outAmount: bigint
    tezosToken: TezosToken,
    source: string,
    receiver: string,
    etherlinkToken: EtherlinkToken
  }
) => {
  expect(finishedBridgeTokenDeposit).toMatchObject<FinishedBridgeTokenDeposit>({
    id: expect.stringMatching(depositIdRegex),
    kind: BridgeTokenTransferKind.Deposit,
    status: BridgeTokenTransferStatus.Finished,
    source: params.source,
    receiver: params.receiver,
    tezosOperation: {
      blockId: expect.any(Number),
      hash: expect.stringMatching(tezosOperationRegex),
      counter: expect.any(Number),
      nonce: expect.any(Number),
      amount: params.inAmount,
      token: params.tezosToken,
      timestamp: expect.any(String),
    },
    etherlinkOperation: {
      blockId: expect.any(Number),
      hash: expect.stringMatching(etherlinkOperationRegex),
      logIndex: params.etherlinkToken.type === 'native' ? null : expect.any(Number),
      amount: params.outAmount,
      token: params.etherlinkToken,
      timestamp: expect.any(String),
    }
  });
};

export const expectPendingWithdrawal = (
  pendingBridgeTokenWithdrawal: BridgeTokenTransfer,
  params: {
    amount: bigint,
    source: string,
    receiver: string,
    etherlinkToken: EtherlinkToken,
  }
) => {
  expect(pendingBridgeTokenWithdrawal).toMatchObject<PendingBridgeTokenWithdrawal>({
    kind: BridgeTokenTransferKind.Withdrawal,
    status: BridgeTokenTransferStatus.Pending,
    source: params.source,
    receiver: params.receiver,
    etherlinkOperation: {
      hash: expect.stringMatching(etherlinkOperationRegex),
      amount: params.amount,
      token: params.etherlinkToken,
      timestamp: expect.any(String),
    }
  });
};

export const expectCreatedWithdrawal = (
  createdBridgeTokenWithdrawal: BridgeTokenTransfer,
  params: {
    amount: bigint,
    etherlinkToken: EtherlinkToken,
    source: string,
    receiver: string,
  }
) => {
  expect(createdBridgeTokenWithdrawal).toMatchObject<CreatedBridgeTokenWithdrawal>({
    id: expect.stringMatching(withdrawalIdRegex),
    kind: BridgeTokenTransferKind.Withdrawal,
    status: BridgeTokenTransferStatus.Created,
    source: params.source,
    receiver: params.receiver,
    etherlinkOperation: {
      blockId: expect.any(Number),
      hash: expect.stringMatching(etherlinkOperationRegex),
      logIndex: expect.any(Number),
      amount: params.amount,
      token: params.etherlinkToken,
      timestamp: expect.any(String),
    },
    rollupData: {
      outboxMessageIndex: expect.any(Number),
      outboxMessageLevel: expect.any(Number)
    }
  });
};

export const expectSealedWithdrawal = (
  sealedBridgeTokenWithdrawal: BridgeTokenTransfer,
  params: {
    amount: bigint,
    etherlinkToken: EtherlinkToken,
    source: string,
    receiver: string,
  }
) => {
  expect(sealedBridgeTokenWithdrawal).toMatchObject<SealedBridgeTokenWithdrawal>({
    id: expect.stringMatching(withdrawalIdRegex),
    kind: BridgeTokenTransferKind.Withdrawal,
    status: BridgeTokenTransferStatus.Sealed,
    source: params.source,
    receiver: params.receiver,
    etherlinkOperation: {
      blockId: expect.any(Number),
      hash: expect.stringMatching(etherlinkOperationRegex),
      logIndex: expect.any(Number),
      amount: params.amount,
      token: params.etherlinkToken,
      timestamp: expect.any(String),
    },
    rollupData: {
      outboxMessageIndex: expect.any(Number),
      outboxMessageLevel: expect.any(Number),
      commitment: expect.any(String),
      proof: expect.any(String),
    }
  });
};

export const expectFinishedWithdrawal = (
  finishedBridgeTokenWithdrawal: BridgeTokenTransfer,
  params: {
    inAmount: bigint,
    outAmount: bigint,
    etherlinkToken: EtherlinkToken,
    source: string,
    receiver: string,
    tezosToken: TezosToken,
  }
) => {
  expect(finishedBridgeTokenWithdrawal).toMatchObject<FinishedBridgeTokenWithdrawal>({
    id: expect.stringMatching(withdrawalIdRegex),
    kind: BridgeTokenTransferKind.Withdrawal,
    status: BridgeTokenTransferStatus.Finished,
    source: params.source,
    receiver: params.receiver,
    etherlinkOperation: {
      blockId: expect.any(Number),
      hash: expect.stringMatching(etherlinkOperationRegex),
      logIndex: expect.any(Number),
      amount: params.inAmount,
      token: params.etherlinkToken,
      timestamp: expect.any(String),
    },
    tezosOperation: {
      blockId: expect.any(Number),
      hash: expect.stringMatching(tezosOperationRegex),
      counter: expect.any(Number),
      nonce: null,
      amount: params.outAmount,
      token: params.tezosToken,
      timestamp: expect.any(String),
    },
    rollupData: {
      outboxMessageIndex: expect.any(Number),
      outboxMessageLevel: expect.any(Number),
      commitment: expect.any(String),
      proof: expect.any(String)
    }
  });
};
