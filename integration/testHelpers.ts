import { InMemorySigner } from '@taquito/signer';
import { TezosToolkit } from '@taquito/taquito';
import Web3 from 'web3';

import { TestConfig } from './testConfig';
import {
  createDefaultTokenBridge,
  BridgeTokenTransferKind, BridgeTokenTransferStatus, LogLevel,
  type DefaultTokenBridgeOptions,
  type TezosToken, type EtherlinkToken,
  type BridgeTokenTransfer,
  type PendingBridgeTokenDeposit, type CreatedBridgeTokenDeposit, type FinishedBridgeTokenDeposit,
  type PendingBridgeTokenWithdrawal, type CreatedBridgeTokenWithdrawal,
  type SealedBridgeTokenWithdrawal, type FinishedBridgeTokenWithdrawal
} from '../src';

const depositIdRegex = /^o[0-9a-zA-Z]{50}_\d+_\d+$/;
const withdrawalIdRegex = /^0x[0-9a-f]{64}_\d+$/;
const tezosOperationRegex = /^o[0-9a-zA-Z]{50}$/;
const etherlinkOperationRegex = /^0x[0-9a-f]{64}$/;

interface CreateTestTokenBridgeParams {
  testConfig: TestConfig,
  tezosToolkit?: TezosToolkit,
  etherlinkToolkit?: Web3,
  overrideOptions?: Partial<Omit<DefaultTokenBridgeOptions, 'tezos' | 'etherlink'>>
}

export const createTestTokenBridge = ({ testConfig, tezosToolkit, etherlinkToolkit, overrideOptions }: CreateTestTokenBridgeParams) => {
  tezosToolkit = tezosToolkit || createTezosToolkitWithSigner(testConfig.tezosRpcUrl, testConfig.tezosAccountPrivateKey);
  etherlinkToolkit = etherlinkToolkit || createEtherlinkToolkitWithSigner(testConfig.etherlinkRpcUrl, testConfig.etherlinkAccountPrivateKey);

  return createDefaultTokenBridge({
    logging: {
      logLevel: LogLevel.Debug
    },
    tezos: {
      name: 'taquito',
      apiType: 'contract',
      tezosToolkit,
      smartRollupAddress: testConfig.tezosRollupAddress
    },
    etherlink: {
      name: 'web3',
      web3: etherlinkToolkit
    },
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
          ticketHelperContractAddress: 'KT1DWVsu4Jtu2ficZ1qtNheGPunm5YVniegT'
        },
        etherlink: {
          ...testConfig.tokens.etherlink.tez,
        }
      },
      {
        tezos: {
          ...testConfig.tokens.tezos.ctez,
          ticketerContractAddress: 'KT1RvSp4yDKUABqWmv3pKGE9fA6iCGy7bqGh',
          ticketHelperContractAddress: 'KT1DHLWJorW9WB6ztkx1XcoaJKWXeTu9yoR1'
        },
        etherlink: {
          ...testConfig.tokens.etherlink.ctez
        }
      },
      {
        tezos: {
          ...testConfig.tokens.tezos.usdt,
          ticketerContractAddress: 'KT1VybveLaWhpQHKph28WcGwSy1ud22KSEan',
          ticketHelperContractAddress: 'KT1DNtHLr9T9zksZjZvQwgtx5XJwrW9wzETB'
        },
        etherlink: {
          ...testConfig.tokens.etherlink.usdt
        }
      },
    ],
    ...overrideOptions
  } as const);
};

export const createTezosToolkitWithSigner = (rpcUrl: string, privateKey: string): TezosToolkit => {
  const toolkit = new TezosToolkit(rpcUrl);

  toolkit.setProvider({
    signer: new InMemorySigner(privateKey),
  });

  return toolkit;
};

export const createEtherlinkToolkitWithSigner = (rpcUrl: string, privateKey: string): Web3 => {
  if (!privateKey.startsWith('0x'))
    privateKey = '0x' + privateKey;

  const toolkit = new Web3(rpcUrl);
  const account = toolkit.eth.accounts.privateKeyToAccount(privateKey);
  toolkit.eth.accounts.wallet.add(account);
  toolkit.eth.defaultAccount = account.address;

  return toolkit;
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
      fee: expect.any(BigInt),
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
      fee: expect.any(BigInt),
      timestamp: expect.any(String),
    },
    etherlinkOperation: {
      blockId: expect.any(Number),
      hash: expect.stringMatching(etherlinkOperationRegex),
      logIndex: expect.any(Number),
      amount: params.outAmount,
      token: params.etherlinkToken,
      fee: expect.any(BigInt),
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
      fee: expect.any(BigInt),
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
      fee: expect.any(BigInt),
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
      fee: expect.any(BigInt),
      timestamp: expect.any(String),
    },
    tezosOperation: {
      blockId: expect.any(Number),
      hash: expect.stringMatching(tezosOperationRegex),
      counter: expect.any(Number),
      nonce: null,
      amount: params.outAmount,
      token: params.tezosToken,
      fee: expect.any(BigInt),
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
