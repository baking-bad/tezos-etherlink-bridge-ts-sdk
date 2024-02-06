import { InMemorySigner } from '@taquito/signer';
import { TezosToolkit } from '@taquito/taquito';
import Web3 from 'web3';

import {
  BridgeTokenTransferKind, BridgeTokenTransferStatus,
  type TezosToken, type EtherlinkToken,
  type BridgeTokenTransfer,
  type PendingBridgeTokenDeposit, type CreatedBridgeTokenDeposit, type FinishedBridgeTokenDeposit,
  type PendingBridgeTokenWithdrawal, type CreatedBridgeTokenWithdrawal,
  type SealedBridgeTokenWithdrawal, type FinishedBridgeTokenWithdrawal,
} from '../src';

const tezosOperationRegex = /^o/;
const etherlinkOperationRegex = /^0x[0-9a-f]{64}$/;

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
    etherlinkToken: EtherlinkToken
  }
) => {
  expect(pendingBridgeTokenDeposit).toMatchObject<PendingBridgeTokenDeposit>({
    kind: BridgeTokenTransferKind.Deposit,
    status: BridgeTokenTransferStatus.Pending,
    tezosOperation: {
      hash: expect.stringMatching(tezosOperationRegex),
      amount: params.amount,
      token: params.tezosToken,
      source: params.source,
      receiver: params.receiver,
      receiverProxy: params.etherlinkToken.type === 'native' ? null : params.etherlinkToken.address,
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
    etherlinkToken: EtherlinkToken
  }
) => {
  expect(createdBridgeTokenDeposit).toMatchObject<CreatedBridgeTokenDeposit>({
    kind: BridgeTokenTransferKind.Deposit,
    status: BridgeTokenTransferStatus.Created,
    tezosOperation: {
      blockId: expect.any(Number),
      hash: expect.stringMatching(tezosOperationRegex),
      amount: params.amount,
      token: params.tezosToken,
      source: params.source,
      receiver: params.receiver,
      // TODO: wait the backend update
      receiverProxy: null,
      fee: expect.any(BigInt),
      timestamp: expect.any(String),
    }
  });
};

export const expectFinishedDeposit = (
  finishedBridgeTokenDeposit: BridgeTokenTransfer,
  params: {
    amount: bigint,
    tezosToken: TezosToken,
    source: string,
    receiver: string,
    etherlinkToken: EtherlinkToken
  }
) => {
  expect(finishedBridgeTokenDeposit).toMatchObject<FinishedBridgeTokenDeposit>({
    kind: BridgeTokenTransferKind.Deposit,
    status: BridgeTokenTransferStatus.Finished,
    tezosOperation: {
      blockId: expect.any(Number),
      hash: expect.stringMatching(tezosOperationRegex),
      amount: params.amount,
      // TODO: wai the backend update
      // token: params.tezosToken
      token: {
        type: 'unknown',
        address: (params.tezosToken as any).address,
      } as any,
      source: params.source,
      receiver: params.receiver,
      // TODO: wait the backend update
      receiverProxy: null,
      fee: expect.any(BigInt),
      timestamp: expect.any(String),
    },
    etherlinkOperation: {
      blockId: expect.any(Number),
      hash: expect.stringMatching(etherlinkOperationRegex),
      amount: params.amount,
      token: params.etherlinkToken,
      source: params.source,
      receiver: params.receiver,
      // TODO: wait the backend update
      receiverProxy: null,
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
    tezosTicketerAddress: string
  }
) => {
  expect(pendingBridgeTokenWithdrawal).toMatchObject<PendingBridgeTokenWithdrawal>({
    kind: BridgeTokenTransferKind.Withdrawal,
    status: BridgeTokenTransferStatus.Pending,
    etherlinkOperation: {
      hash: expect.stringMatching(etherlinkOperationRegex),
      amount: params.amount,
      token: params.etherlinkToken,
      source: params.source,
      receiver: params.receiver,
      receiverProxy: params.tezosTicketerAddress,
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
    tezosTicketerAddress: string
  }
) => {
  expect(createdBridgeTokenWithdrawal).toMatchObject<CreatedBridgeTokenWithdrawal>({
    kind: BridgeTokenTransferKind.Withdrawal,
    status: BridgeTokenTransferStatus.Created,
    etherlinkOperation: {
      blockId: expect.any(Number),
      hash: expect.stringMatching(etherlinkOperationRegex),
      amount: params.amount,
      token: params.etherlinkToken,
      source: params.source,
      receiver: params.receiver,
      // TODO: wait the backend update
      receiverProxy: null,
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
    tezosTicketerAddress: string
  }
) => {
  expect(sealedBridgeTokenWithdrawal).toMatchObject<SealedBridgeTokenWithdrawal>({
    kind: BridgeTokenTransferKind.Withdrawal,
    status: BridgeTokenTransferStatus.Sealed,
    etherlinkOperation: {
      blockId: expect.any(Number),
      hash: expect.stringMatching(etherlinkOperationRegex),
      amount: params.amount,
      token: params.etherlinkToken,
      source: params.source,
      receiver: params.receiver,
      // TODO: wait the backend update
      receiverProxy: null,
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

export const expectFinishedWithdrawal = (
  finishedBridgeTokenWithdrawal: BridgeTokenTransfer,
  params: {
    amount: bigint,
    etherlinkToken: EtherlinkToken,
    source: string,
    receiver: string,
    tezosToken: TezosToken,
    tezosTicketerAddress: string
  }
) => {
  expect(finishedBridgeTokenWithdrawal).toMatchObject<FinishedBridgeTokenWithdrawal>({
    kind: BridgeTokenTransferKind.Withdrawal,
    status: BridgeTokenTransferStatus.Finished,
    etherlinkOperation: {
      blockId: expect.any(Number),
      hash: expect.stringMatching(etherlinkOperationRegex),
      amount: params.amount,
      token: params.etherlinkToken,
      source: params.source,
      receiver: params.receiver,
      // TODO: wait the backend update
      receiverProxy: null,
      fee: expect.any(BigInt),
      timestamp: expect.any(String),
    },
    tezosOperation: {
      blockId: expect.any(Number),
      hash: expect.stringMatching(tezosOperationRegex),
      amount: params.amount,
      // TODO: wai the backend update
      // token: params.tezosToken
      token: {
        type: 'unknown',
        address: (params.tezosToken as any).address,
      } as any,
      source: params.source,
      receiver: params.receiver,
      // TODO: wait the backend update
      receiverProxy: null,
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
