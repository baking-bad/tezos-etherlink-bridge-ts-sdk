import type { ContractMethod, ContractMethodObject, ContractProvider, Wallet } from '@taquito/taquito';

import type { FA2Contract } from '../contracts';

interface WrapTransactionsWithFA2ApproveParameters<TApi extends ContractProvider | Wallet> {
  batch: ReturnType<TApi['batch']>;
  tokenContract: FA2Contract<TApi>;
  ownerAddress: string;
  approvedAddress: string;
  tokenId: string;
  contractCalls:
  | ContractMethod<TApi>
  | ContractMethodObject<TApi>
  | Array<ContractMethod<TApi> | ContractMethodObject<TApi>>;
}

export function wrapContractCallsWithApprove<TApi extends ContractProvider | Wallet>(options: WrapTransactionsWithFA2ApproveParameters<TApi>): typeof options['batch'];
export function wrapContractCallsWithApprove(options: WrapTransactionsWithFA2ApproveParameters<ContractProvider>): typeof options['batch'] {
  const batch = options.batch
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
}
