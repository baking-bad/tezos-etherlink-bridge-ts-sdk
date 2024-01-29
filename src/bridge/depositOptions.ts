import type { ParamsWithKind, WalletParamsWithKind } from '@taquito/taquito';

interface DepositOptionsBase {
  useApprove?: boolean;
  resetFA12Approve?: boolean;
}

export interface DepositOptions extends DepositOptionsBase {
  useWalletApi: false;
  beforeCalls?: ParamsWithKind[];
  afterCalls?: ParamsWithKind[];
}

export interface WalletDepositOptions extends DepositOptionsBase {
  useWalletApi?: true;
  beforeCalls?: WalletParamsWithKind[];
  afterCalls?: WalletParamsWithKind[];
}
