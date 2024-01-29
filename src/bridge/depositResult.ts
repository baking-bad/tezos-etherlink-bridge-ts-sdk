import type { ContractProvider, Wallet } from '@taquito/taquito';

import type { PendingBridgeTokenDeposit } from './bridgeOperations';

export interface WalletDepositResult {
  readonly tokenTransfer: PendingBridgeTokenDeposit;
  readonly depositOperation: Awaited<ReturnType<ReturnType<Wallet['batch']>['send']>>;
}

export interface DepositResult {
  readonly tokenTransfer: PendingBridgeTokenDeposit;
  readonly depositOperation: Awaited<ReturnType<ReturnType<ContractProvider['batch']>['send']>>;
}
