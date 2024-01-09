import type { ContractMethod, ContractMethodObject, ContractProvider, OperationBatch, TezosToolkit, Wallet } from '@taquito/taquito';

import type { FA2Contract } from '../contracts';

export interface WrapTransactionsWithFA2ApproveParameters {
  toolkit: TezosToolkit;
  tokenContract: FA2Contract;
  ownerAddress: string;
  approvedAddress: string;
  tokenId: string;
  contractCalls:
  | ContractMethod<Wallet | ContractProvider>
  | ContractMethodObject<Wallet | ContractProvider>
  | Array<ContractMethod<Wallet | ContractProvider> | ContractMethodObject<Wallet | ContractProvider>>;
}

export const wrapContractCallsWithApprove = (options: WrapTransactionsWithFA2ApproveParameters): OperationBatch => {
  const batch = options.toolkit.contract.batch()
    .withContractCall(options.tokenContract.methods.update_operators([{
      add_operator: {
        owner: options.ownerAddress,
        operator: options.approvedAddress,
        token_id: options.tokenId
      }
    }]));

  if (Array.isArray(options.contractCalls))
    options.contractCalls.forEach(call => batch.withContractCall(call));
  else
    batch.withContractCall(options.contractCalls);

  batch
    .withContractCall(options.tokenContract.methods.update_operators([{
      remove_operator: {
        owner: options.ownerAddress,
        operator: options.approvedAddress,
        token_id: options.tokenId
      }
    }]));

  return batch;
};
