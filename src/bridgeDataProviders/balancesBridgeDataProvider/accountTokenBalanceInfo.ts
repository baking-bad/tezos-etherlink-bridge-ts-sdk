import type { EtherlinkToken } from '../../etherlink';
import type { TezosToken } from '../../tezos';

export interface TokenBalanceInfo {
  readonly token: TezosToken | EtherlinkToken;
  readonly balance: bigint;
}

export interface AccountTokenBalanceInfo {
  readonly address: string;
  readonly tokenBalances: readonly TokenBalanceInfo[];
}
