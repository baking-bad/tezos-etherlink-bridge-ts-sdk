import type { AccountTokenBalanceInfo } from './accountTokenBalanceInfo';
import type { EtherlinkToken } from '../../etherlink';
import type { TezosToken } from '../../tezos';

export interface BalancesBridgeDataProvider {
  getBalance(accountAddress: string, token: TezosToken | EtherlinkToken): Promise<AccountTokenBalanceInfo>;

  getBalances(accountAddress: string): Promise<AccountTokenBalanceInfo>;
  getBalances(accountAddress: string, tokens: ReadonlyArray<TezosToken | EtherlinkToken>): Promise<AccountTokenBalanceInfo>;
  getBalances(accountAddress: string, offset: number, limit: number): Promise<AccountTokenBalanceInfo>;
  getBalances(accountAddress: string, tokensOrOffset?: ReadonlyArray<TezosToken | EtherlinkToken> | number, limit?: number): Promise<AccountTokenBalanceInfo>;
}
