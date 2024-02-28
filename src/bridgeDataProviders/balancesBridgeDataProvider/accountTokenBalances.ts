import type { TezosToken, EtherlinkToken } from '../../tokens';

export interface TokenBalanceInfo {
  readonly token: TezosToken | EtherlinkToken;
  readonly balance: bigint;
}

export interface AccountTokenBalance {
  readonly address: string;
  readonly token: TezosToken | EtherlinkToken;
  readonly balance: bigint;
}

export interface AccountTokenBalances {
  readonly address: string;
  readonly tokenBalances: readonly TokenBalanceInfo[];
}
