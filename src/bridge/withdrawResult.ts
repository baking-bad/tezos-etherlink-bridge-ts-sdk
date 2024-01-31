import type { ContractProvider } from '@taquito/taquito';
import type { TransactionReceipt } from 'web3';

import type { PendingBridgeTokenWithdrawal, SealedBridgeTokenWithdrawal } from './bridgeOperations';

export interface StartWithdrawResult {
  readonly tokenTransfer: PendingBridgeTokenWithdrawal;
  readonly startWithdrawOperation: TransactionReceipt;
}

export interface FinishWithdrawResult {
  readonly tokenTransfer: SealedBridgeTokenWithdrawal;
  readonly finishWithdrawOperation: Awaited<ReturnType<ContractProvider['smartRollupExecuteOutboxMessage']>>;
}
