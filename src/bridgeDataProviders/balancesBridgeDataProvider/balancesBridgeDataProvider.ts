import type { AccountTokenBalance, AccountTokenBalances } from './accountTokenBalances';
import type { BalancesFetchOptions } from './balancesFetchOptions';
import type { TezosToken, EtherlinkToken } from '../../tokens';

export interface BalancesBridgeDataProvider {
  getBalance(accountAddress: string, token: TezosToken | EtherlinkToken): Promise<AccountTokenBalance>;

  getBalances(accountAddress: string): Promise<AccountTokenBalances>;
  getBalances(accountAddress: string, tokens: ReadonlyArray<TezosToken | EtherlinkToken>): Promise<AccountTokenBalances>;
  getBalances(accountAddress: string, fetchOptions: BalancesFetchOptions): Promise<AccountTokenBalances>;
  getBalances(accountAddress: string, tokensOrFetchOptions?: ReadonlyArray<TezosToken | EtherlinkToken> | BalancesFetchOptions): Promise<AccountTokenBalances>;
}
