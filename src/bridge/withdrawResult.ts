import type { TransactionReceipt } from 'web3';

import type { PendingBridgeTokenWithdrawal, SealedBridgeTokenWithdrawal } from './bridgeOperations';

export interface StartWithdrawResult {
  readonly tokenTransfer: PendingBridgeTokenWithdrawal;
  readonly withdrawOperation: TransactionReceipt;
}

export interface FinishWithdrawResult {
  readonly tokenTransfer: SealedBridgeTokenWithdrawal;
}
