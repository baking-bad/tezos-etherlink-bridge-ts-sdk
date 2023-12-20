import { packDataBytes } from '@taquito/michel-codec';
import { ContractMethod, TezosToolkit, Wallet } from '@taquito/taquito';
import { BatchWalletOperation } from '@taquito/taquito/dist/types/wallet/batch-operation';
import BigNumber from 'bignumber.js';

import { TicketHelperContract } from './contracts';
import { FA12Contract, FA2Contract } from '../contracts';
import { fa12helper, fa2helper } from '../utils';

export const deposit = async (
  toolkit: TezosToolkit,
  rollupAddress: string,
  ticketHelperContractAddress: string,
  //l1TokenStandard: string, // 'FA12' | 'FA20' | others types fir the future
  l1TokenContractAddress: string,
  l1TokenId: BigNumber | undefined,
  l2TokenProxyContractAddress: string,
  l2ReceiverAddress: string,
  amount: BigNumber
): Promise<BatchWalletOperation> => {
  const ticketHelperContract = await toolkit.wallet.at<TicketHelperContract<Wallet>>(ticketHelperContractAddress);
  const routingInfo = packRoutingInfo(l2TokenProxyContractAddress, l2ReceiverAddress);
  const depositOperation = ticketHelperContract.methodsObject.deposit({
    rollup: rollupAddress,
    routing_info: routingInfo,
    amount
  });

  const operation = l1TokenId === undefined
    ? await depositFa12(toolkit, ticketHelperContractAddress, depositOperation, l1TokenContractAddress, amount)
    : await depositFa2(toolkit, ticketHelperContractAddress, depositOperation, l1TokenContractAddress, l1TokenId);

  return operation;
};

const depositFa12 = async (
  toolkit: TezosToolkit,
  ticketHelperContractAddress: string,
  depositOperation: ContractMethod<Wallet>,
  l1TokenContractAddress: string,
  amount: BigNumber
): Promise<BatchWalletOperation> => {
  const tokenContract = await toolkit.wallet.at<FA12Contract<Wallet>>(l1TokenContractAddress);
  const operation = await fa12helper.wrapContractCallsWithApprove({
    toolkit,
    tokenContract,
    approvedAmount: amount,
    approvedAddress: ticketHelperContractAddress,
    contractCalls: [depositOperation]
  }).send();

  return operation;
};

const depositFa2 = async (
  toolkit: TezosToolkit,
  ticketHelperContractAddress: string,
  depositOperation: ContractMethod<Wallet>,
  l1TokenContractAddress: string,
  l1TokenId: BigNumber
): Promise<BatchWalletOperation> => {
  const tokenContract = await toolkit.wallet.at<FA2Contract<Wallet>>(l1TokenContractAddress);
  const ownerAddress = await toolkit.wallet.pkh();
  const operation = await fa2helper.wrapContractCallsWithApprove({
    toolkit,
    tokenContract,
    tokenId: l1TokenId,
    ownerAddress,
    approvedAddress: ticketHelperContractAddress,
    contractCalls: [depositOperation]
  }).send();

  return operation;
};

const packRoutingInfo = (l2TokenProxyContractAddress: string, l2ReceiverAddress: string): string => {
  const tokenProxyAddressBytes = packDataBytes({ string: l2TokenProxyContractAddress }, { prim: 'address' }).bytes;
  const receiverAddressBytes = packDataBytes({ string: l2ReceiverAddress }, { prim: 'address' }).bytes;

  return `0x${tokenProxyAddressBytes}${receiverAddressBytes}`;
};
