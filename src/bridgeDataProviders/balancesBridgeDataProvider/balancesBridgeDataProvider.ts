import type { AccountTokenBalance, AccountTokenBalances } from './accountTokenBalances';
import type { TezosToken, EtherlinkToken } from '../../tokens';

export interface BalancesBridgeDataProvider {
  getBalance(accountAddress: string, token: TezosToken | EtherlinkToken): Promise<AccountTokenBalance>;

  getBalances(accountAddress: string): Promise<AccountTokenBalances>;
  getBalances(accountAddress: string, tokens: ReadonlyArray<TezosToken | EtherlinkToken>): Promise<AccountTokenBalances>;
  getBalances(accountAddress: string, offset: number, limit: number): Promise<AccountTokenBalances>;
  getBalances(accountAddress: string, tokensOrOffset?: ReadonlyArray<TezosToken | EtherlinkToken> | number, limit?: number): Promise<AccountTokenBalances>;
}
