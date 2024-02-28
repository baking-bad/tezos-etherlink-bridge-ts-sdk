import type { BatchOperation, ContractProvider, OperationBatch, ParamsWithKind, TransactionOperation } from '@taquito/taquito';

import type { FA12Contract, FA2Contract, NativeTokenTicketHelper, NonNativeTokenTicketHelper } from './contracts';
import { TaquitoTezosBridgeBlockchainService, type TaquitoTezosBridgeBlockchainServiceOptions } from './taquitoTezosBridgeBlockchainService';
import type {
  DepositNativeTokenParams, DepositNativeTokenResult,
  DepositNonNativeTokensParams, DepositNonNativeTokenResult,
  FinishWithdrawParams, FinishWithdrawResult
} from '../tezosBridgeBlockchainService';

export interface TaquitoContractTezosBridgeBlockchainServiceOptions extends TaquitoTezosBridgeBlockchainServiceOptions {
}

export class TaquitoContractTezosBridgeBlockchainService extends TaquitoTezosBridgeBlockchainService<ContractProvider> {
  async depositNativeToken(params: DepositNativeTokenParams): Promise<DepositNativeTokenResult & { operation: TransactionOperation; }> {
    const operation = await this.depositNativeTokenInternal(params);

    return {
      amount: params.amount,
      hash: operation.hash,
      timestamp: this.getCurrentOperationTimestamp(),
      operation
    };
  }

  async depositNonNativeToken(params: DepositNonNativeTokensParams): Promise<DepositNonNativeTokenResult & { operation: BatchOperation; }> {
    const operation = await this.depositNonNativeTokenInternal(params);

    return {
      amount: params.amount,
      hash: operation.hash,
      timestamp: this.getCurrentOperationTimestamp(),
      operation
    };
  }

  async finishWithdraw(params: FinishWithdrawParams): Promise<FinishWithdrawResult & { operation: Awaited<ReturnType<ContractProvider['smartRollupExecuteOutboxMessage']>>; }> {
    const operation = await this.finishWithdrawInternal(params);

    return {
      hash: operation.hash,
      timestamp: this.getCurrentOperationTimestamp(),
      operation
    };
  }

  protected createBatch(params?: ParamsWithKind[]): OperationBatch {
    return this.tezosToolkit.contract.batch(params);
  }

  protected getNativeTokenTicketHelperContract(ticketHelperContractAddress: string): Promise<NativeTokenTicketHelper<ContractProvider>> {
    return this.tezosToolkit.contract.at<NativeTokenTicketHelper<ContractProvider>>(ticketHelperContractAddress);
  }

  protected getNonNativeTokenTicketHelperContract(ticketHelperContractAddress: string): Promise<NonNativeTokenTicketHelper<ContractProvider>> {
    return this.tezosToolkit.contract.at<NonNativeTokenTicketHelper<ContractProvider>>(ticketHelperContractAddress);
  }

  protected getFA12TokenContract(fa12TokenContractAddress: string): Promise<FA12Contract<ContractProvider>> {
    return this.tezosToolkit.contract.at<FA12Contract<ContractProvider>>(fa12TokenContractAddress);
  }

  protected getFA2TokenContract(fa2TokenContractAddress: string): Promise<FA2Contract<ContractProvider>> {
    return this.tezosToolkit.contract.at<FA2Contract<ContractProvider>>(fa2TokenContractAddress);
  }
}
