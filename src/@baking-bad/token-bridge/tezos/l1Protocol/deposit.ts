import { ContractMethod, TezosToolkit, Wallet } from '@taquito/taquito';
import { BatchWalletOperation } from '@taquito/taquito/dist/types/wallet/batch-operation';
import BigNumber from 'bignumber.js';

import { TicketHelperContract } from './contracts';
import { checkEvmAddressIsCorrect } from '../../evm/utils';
import { FA12Contract, FA2Contract } from '../contracts';
import { fa12helper, fa2helper } from '../utils';

export const deposit = async (
  toolkit: TezosToolkit,
  rollupAddress: string,
  ticketHelperContractAddress: string,
  //l1TokenStandard: string, // 'FA12' | 'FA20' | others types for the future
  l1TokenContractAddress: string,
  l1TokenId: BigNumber | undefined,
  l2ReceiverAddress: string,
  l2TokenProxyContractAddress: string,
  amount: BigNumber
): Promise<BatchWalletOperation> => {
  const depositOperation = await createDepositOperation(
    toolkit,
    rollupAddress,
    ticketHelperContractAddress,
    l2ReceiverAddress,
    l2TokenProxyContractAddress,
    amount
  );

  const batchOperation = l1TokenId === undefined
    ? await batchWithFa12Approve(toolkit, ticketHelperContractAddress, depositOperation, l1TokenContractAddress, amount)
    : await batchWithFa2Approve(toolkit, ticketHelperContractAddress, depositOperation, l1TokenContractAddress, l1TokenId);

  return batchOperation;
};

export const createDepositOperation = async (
  toolkit: TezosToolkit,
  rollupAddress: string,
  ticketHelperContractAddress: string,
  l2ReceiverAddress: string,
  l2TokenProxyContractAddress: string,
  amount: BigNumber
): Promise<ContractMethod<Wallet>> => {
  const ticketHelperContract = await toolkit.wallet.at<TicketHelperContract<Wallet>>(ticketHelperContractAddress);
  const routingInfo = packRoutingInfo(l2ReceiverAddress, l2TokenProxyContractAddress);
  const operation = ticketHelperContract.methodsObject.deposit({
    rollup: rollupAddress,
    routing_info: routingInfo,
    amount
  });

  return operation;
};

const batchWithFa12Approve = async (
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

const batchWithFa2Approve = async (
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

export const packRoutingInfo = (l2ReceiverAddress: string, l2TokenProxyContractAddress: string): string => {
  checkEvmAddressIsCorrect(l2ReceiverAddress);
  checkEvmAddressIsCorrect(l2TokenProxyContractAddress);

  return `${l2ReceiverAddress.substring(2)}${l2TokenProxyContractAddress.substring(2)}`;
};
