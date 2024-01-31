import type { ContractProvider, Wallet } from '@taquito/taquito';

import type { PendingBridgeTokenDeposit } from './bridgeOperations';

export interface WalletDepositResult {
  tokenTransfer: PendingBridgeTokenDeposit;
  depositOperation: Awaited<ReturnType<ReturnType<Wallet['batch']>['send']>>;
}

export interface DepositResult {
  tokenTransfer: PendingBridgeTokenDeposit;
  depositOperation: Awaited<ReturnType<ReturnType<ContractProvider['batch']>['send']>>;
}
