import type { ContractProvider } from '@taquito/taquito';
import type { TransactionReceipt } from 'web3';

import type { PendingBridgeTokenWithdrawal, SealedBridgeTokenWithdrawal } from './bridgeOperations';

export interface StartWithdrawResult {
  tokenTransfer: PendingBridgeTokenWithdrawal;
  startWithdrawOperation: TransactionReceipt;
}

export interface FinishWithdrawResult {
  tokenTransfer: SealedBridgeTokenWithdrawal;
  finishWithdrawOperation: Awaited<ReturnType<ContractProvider['smartRollupExecuteOutboxMessage']>>;
}
