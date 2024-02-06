import { InMemorySigner } from '@taquito/signer';
import { TezosToolkit } from '@taquito/taquito';
import Web3 from 'web3';

import {
  BridgeTokenTransferKind, BridgeTokenTransferStatus,
  TezosToken,
  type PendingBridgeTokenDeposit, EtherlinkToken, FinishedBridgeTokenDeposit, BridgeTokenTransfer
} from '../src';

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
    source: string,
    receiver: string,
    tezosToken: TezosToken,
    etherlinkToken: EtherlinkToken
  }
) => {
  expect(pendingBridgeTokenDeposit).toMatchObject<PendingBridgeTokenDeposit>({
    kind: BridgeTokenTransferKind.Deposit,
    status: BridgeTokenTransferStatus.Pending,
    tezosOperation: {
      hash: expect.stringMatching('^o'),
      amount: params.amount,
      source: params.source,
      receiver: params.receiver,
      receiverProxy: params.etherlinkToken.type === 'native' ? null : params.etherlinkToken.address,
      timestamp: expect.any(String),
      token: params.tezosToken
    }
  });
};

export const expectFinishedDeposit = (
  finishedBridgeTokenDeposit: BridgeTokenTransfer,
  params: {
    amount: bigint,
    source: string,
    receiver: string,
    tezosToken: TezosToken,
    etherlinkToken: EtherlinkToken,
    etherlinkKernelAddress: string
  }
) => {
  expect(finishedBridgeTokenDeposit).toMatchObject<FinishedBridgeTokenDeposit>({
    kind: BridgeTokenTransferKind.Deposit,
    status: BridgeTokenTransferStatus.Finished,
    tezosOperation: {
      amount: params.amount,
      blockId: expect.any(Number),
      fee: expect.any(BigInt),
      hash: expect.stringMatching('^o'),
      source: params.source,
      receiver: params.receiver,
      // TODO: wait the backend update
      // receiverProxy: params.etherlinkToken.type === 'native' ? null : params.etherlinkToken.address,
      receiverProxy: null,
      timestamp: expect.any(String),
      // TODO: wai the backend update
      // token: params.tezosToken
      token: {
        type: 'unknown',
        address: (params.tezosToken as any).address,
      } as any
    },
    // TODO: wait when the backend matches Etherlink operation for native tokens.
    etherlinkOperation: params.tezosToken.type === 'native' ? (null as any) : {
      amount: params.amount,
      blockId: expect.any(Number),
      fee: expect.any(BigInt),
      hash: expect.stringMatching('^0x'),
      source: params.source,
      receiver: params.receiver,
      // TODO: wait the backend update
      // receiverProxy: params.etherlinkToken.type === 'native' ? null : params.etherlinkToken.address,
      receiverProxy: null,
      timestamp: expect.any(String),
      token: params.etherlinkToken
    }
  });
};
