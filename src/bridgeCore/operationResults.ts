import type { PendingBridgeTokenDeposit, PendingBridgeTokenWithdrawal, SealedBridgeTokenWithdrawal } from './bridgeOperations';

export interface StartWithdrawResult<TOperationMethod extends (...args: any[]) => Promise<unknown>> {
  tokenTransfer: PendingBridgeTokenWithdrawal;
  operationResult: Awaited<ReturnType<TOperationMethod>>;
}

export interface FinishWithdrawResult<TOperationMethod extends (...args: any[]) => Promise<unknown>> {
  tokenTransfer: SealedBridgeTokenWithdrawal;
  operationResult: Awaited<ReturnType<TOperationMethod>>;
}

export interface DepositResult<TOperationMethod extends (...args: any[]) => Promise<unknown>> {
  tokenTransfer: PendingBridgeTokenDeposit;
  operationResult: Awaited<ReturnType<TOperationMethod>>;
}
