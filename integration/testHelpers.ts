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
    kind: BridgeTokenTransferKind.Deposit,
    status: BridgeTokenTransferStatus.Created,
    source: params.source,
    receiver: params.receiver,
    tezosOperation: {
      blockId: expect.any(Number),
      hash: expect.stringMatching(tezosOperationRegex),
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
    source: params.source,
    receiver: params.receiver,
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
      fee: expect.any(BigInt),
      timestamp: expect.any(String),
    },
    etherlinkOperation: {
      blockId: expect.any(Number),
      hash: expect.stringMatching(etherlinkOperationRegex),
      amount: params.amount,
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
    kind: BridgeTokenTransferKind.Withdrawal,
    status: BridgeTokenTransferStatus.Created,
    source: params.source,
    receiver: params.receiver,
    etherlinkOperation: {
      blockId: expect.any(Number),
      hash: expect.stringMatching(etherlinkOperationRegex),
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
    kind: BridgeTokenTransferKind.Withdrawal,
    status: BridgeTokenTransferStatus.Sealed,
    source: params.source,
    receiver: params.receiver,
    etherlinkOperation: {
      blockId: expect.any(Number),
      hash: expect.stringMatching(etherlinkOperationRegex),
      amount: params.amount,
      token: params.etherlinkToken,
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
  }
) => {
  expect(finishedBridgeTokenWithdrawal).toMatchObject<FinishedBridgeTokenWithdrawal>({
    kind: BridgeTokenTransferKind.Withdrawal,
    status: BridgeTokenTransferStatus.Finished,
    source: params.source,
    receiver: params.receiver,
    etherlinkOperation: {
      blockId: expect.any(Number),
      hash: expect.stringMatching(etherlinkOperationRegex),
      amount: params.amount,
      token: params.etherlinkToken,
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
