import type { ContractProvider, TransactionWalletOperation, Wallet, WalletOperationBatch, WalletParamsWithKind } from '@taquito/taquito';

import type { FA12Contract, FA2Contract, NativeTokenTicketHelper, NonNativeTokenTicketHelper } from './contracts';
import { TaquitoTezosBridgeBlockchainService, type TaquitoTezosBridgeBlockchainServiceOptions } from './taquitoTezosBridgeBlockchainService';
import type {
  DepositNativeTokenParams, DepositNativeTokenResult,
  DepositNonNativeTokenResult, DepositNonNativeTokensParams,
  FinishWithdrawParams, FinishWithdrawResult
} from '../tezosBridgeBlockchainService';

export interface TaquitoWalletTezosBridgeBlockchainServiceOptions extends TaquitoTezosBridgeBlockchainServiceOptions {
}

export class TaquitoWalletTezosBridgeBlockchainService extends TaquitoTezosBridgeBlockchainService<Wallet> {
  async depositNativeToken(params: DepositNativeTokenParams): Promise<DepositNativeTokenResult & { operation: TransactionWalletOperation; }> {
    const operation = await this.depositNativeTokenInternal(params);

    return {
      amount: params.amount,
      hash: operation.opHash,
      timestamp: this.getCurrentOperationTimestamp(),
      operation
    };
  }

  async depositNonNativeToken(params: DepositNonNativeTokensParams): Promise<DepositNonNativeTokenResult & { operation: Awaited<ReturnType<ReturnType<Wallet['batch']>['send']>>; }> {
    const operation = await this.depositNonNativeTokenInternal(params);

    return {
      amount: params.amount,
      hash: operation.opHash,
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

  protected createBatch(params?: WalletParamsWithKind[]): WalletOperationBatch {
    return this.tezosToolkit.wallet.batch(params);
  }

  protected getNativeTokenTicketHelperContract(ticketHelperContractAddress: string): Promise<NativeTokenTicketHelper<Wallet>> {
    return this.tezosToolkit.wallet.at<NativeTokenTicketHelper<Wallet>>(ticketHelperContractAddress);
  }

  protected getNonNativeTokenTicketHelperContract(ticketHelperContractAddress: string): Promise<NonNativeTokenTicketHelper<Wallet>> {
    return this.tezosToolkit.wallet.at<NonNativeTokenTicketHelper<Wallet>>(ticketHelperContractAddress);
  }

  protected getFA12TokenContract(fa12TokenContractAddress: string): Promise<FA12Contract<Wallet>> {
    return this.tezosToolkit.wallet.at<FA12Contract<Wallet>>(fa12TokenContractAddress);
  }

  protected getFA2TokenContract(fa2TokenContractAddress: string): Promise<FA2Contract<Wallet>> {
    return this.tezosToolkit.wallet.at<FA2Contract<Wallet>>(fa2TokenContractAddress);
  }
}
