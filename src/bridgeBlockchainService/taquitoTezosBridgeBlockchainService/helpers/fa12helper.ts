import type { ContractMethod, ContractMethodObject, ContractProvider, Wallet } from '@taquito/taquito';

import type { FA12Contract } from '../contracts';

interface WrapTransactionsWithFA12ApproveParameters<TApi extends ContractProvider | Wallet> {
  batch: ReturnType<TApi['batch']>;
  tokenContract: FA12Contract<TApi>;
  approvedAddress: string;
  approvedAmount: bigint;
  contractCalls:
  | ContractMethod<TApi>
  | ContractMethodObject<TApi>
  | Array<ContractMethod<TApi> | ContractMethodObject<TApi>>;
  isNeedToReset?: boolean;
}

export function wrapContractCallsWithApprove<TApi extends ContractProvider | Wallet>(options: WrapTransactionsWithFA12ApproveParameters<TApi>): typeof options['batch'];
export function wrapContractCallsWithApprove(options: WrapTransactionsWithFA12ApproveParameters<ContractProvider>): typeof options['batch'] {
  const batch = options.batch;

  if (options.isNeedToReset === undefined || options.isNeedToReset)
    batch.withContractCall(options.tokenContract.methods.approve(options.approvedAddress, 0n));

  batch.withContractCall(options.tokenContract.methods.approve(options.approvedAddress, options.approvedAmount));

  if (Array.isArray(options.contractCalls))
    options.contractCalls.forEach(call => batch.withContractCall(call));
  else
    batch.withContractCall(options.contractCalls);

  return batch;
}
