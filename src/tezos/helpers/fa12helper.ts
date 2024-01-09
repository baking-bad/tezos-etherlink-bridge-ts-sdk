import type { ContractMethod, ContractMethodObject, ContractProvider, TezosToolkit, Wallet, OperationBatch } from '@taquito/taquito';

import type { FA12Contract } from '../contracts';

export interface WrapTransactionsWithFA12ApproveParameters {
  toolkit: TezosToolkit;
  tokenContract: FA12Contract;
  approvedAddress: string;
  approvedAmount: bigint;
  contractCalls:
  | ContractMethod<Wallet | ContractProvider>
  | ContractMethodObject<Wallet | ContractProvider>
  | Array<ContractMethod<Wallet | ContractProvider> | ContractMethodObject<Wallet | ContractProvider>>;
}

export const wrapContractCallsWithApprove = (options: WrapTransactionsWithFA12ApproveParameters): OperationBatch => {
  const batch = options.toolkit.contract.batch()
    .withContractCall(options.tokenContract.methods.approve(options.approvedAddress, options.approvedAmount));

  if (Array.isArray(options.contractCalls))
    options.contractCalls.forEach(call => batch.withContractCall(call));
  else
    batch.withContractCall(options.contractCalls);

  return batch;
};
