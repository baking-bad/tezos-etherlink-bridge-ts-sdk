interface DepositOptionsBase {
  useApprove?: boolean;
  resetFA12Approve?: boolean;
}

export interface DepositOptions extends DepositOptionsBase {
  useWalletApi: false;
}

export interface WalletDepositOptions extends DepositOptionsBase {
  useWalletApi?: true;
}
