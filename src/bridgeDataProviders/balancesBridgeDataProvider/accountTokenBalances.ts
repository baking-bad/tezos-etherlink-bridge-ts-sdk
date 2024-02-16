import type { EtherlinkToken } from '../../etherlink';
import type { TezosToken } from '../../tezos';

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
