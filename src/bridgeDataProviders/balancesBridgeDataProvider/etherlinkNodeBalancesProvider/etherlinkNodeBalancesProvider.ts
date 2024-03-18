import type { BalanceData, RPCNodeResponse } from './dto';
import { EtherlinkNodeRPCError, EtherlinkNodeTokenBalanceNotSupported } from './error';
import { RemoteService } from '../../../common';
import { getErrorLogMessage, loggerProvider } from '../../../logging';
import type { NativeEtherlinkToken } from '../../../tokens';
import { guards } from '../../../utils';
import type { AccountTokenBalance, AccountTokenBalances } from '../accountTokenBalances';
import type { BalancesBridgeDataProvider } from '../balancesBridgeDataProvider';
import type { BalancesFetchOptions } from '../balancesFetchOptions';

export class EtherlinkNodeBalancesProvider extends RemoteService implements BalancesBridgeDataProvider {
  async getBalance(accountAddress: string, token: NativeEtherlinkToken): Promise<AccountTokenBalance> {
    if (token.type !== 'native') {
      const error = new EtherlinkNodeTokenBalanceNotSupported(token);
      loggerProvider.logger.error(error);
      throw error;
    }

    return this.getNativeEtherlinkTokenBalance(accountAddress, false);
  }

  async getBalances(accountAddress: string): Promise<AccountTokenBalances>;
  async getBalances(accountAddress: string, tokens: readonly NativeEtherlinkToken[]): Promise<AccountTokenBalances>;
  async getBalances(accountAddress: string, fetchOptions: BalancesFetchOptions): Promise<AccountTokenBalances>;
  async getBalances(accountAddress: string, tokensOrFetchOptions?: readonly NativeEtherlinkToken[] | BalancesFetchOptions): Promise<AccountTokenBalances>;
  async getBalances(accountAddress: string, tokensOrFetchOptions?: readonly NativeEtherlinkToken[] | BalancesFetchOptions): Promise<AccountTokenBalances> {
    const isAllTokens = !guards.isReadonlyArray(tokensOrFetchOptions);

    if (!isAllTokens && tokensOrFetchOptions.length && tokensOrFetchOptions[0]!.type !== 'native') {
      const error = new EtherlinkNodeTokenBalanceNotSupported(tokensOrFetchOptions[0]!);
      loggerProvider.logger.error(error);
      throw error;
    }

    return this.getNativeEtherlinkTokenBalance(accountAddress, true);
  }

  protected async getNativeEtherlinkTokenBalance(accountAddress: string, isBalances: false): Promise<AccountTokenBalance>;
  protected async getNativeEtherlinkTokenBalance(accountAddress: string, isBalances: true): Promise<AccountTokenBalances>;
  protected async getNativeEtherlinkTokenBalance(accountAddress: string, isBalances: boolean): Promise<AccountTokenBalance | AccountTokenBalances> {
    loggerProvider.logger.log(`Getting the Etherlink native token balance for the ${accountAddress} address`);

    const getBalanceResponse = await this.fetch<RPCNodeResponse<BalanceData>>('', 'json', {
      method: 'POST',
      body: JSON.stringify({
        method: 'eth_getBalance',
        params: [
          accountAddress,
          'latest'
        ],
        id: 1,
        jsonrpc: '2.0'
      })
    });
    this.ensureNoRPCErrors(getBalanceResponse);

    loggerProvider.logger.log(`The Etherlink native token balance for the  ${accountAddress} address has been received`);

    const token: NativeEtherlinkToken = { type: 'native' };
    const balance = BigInt(getBalanceResponse.result);
    const accountTokenBalanceOrBalances = isBalances
      ? {
        address: accountAddress,
        tokenBalances: [{
          token,
          balance
        }]
      } satisfies AccountTokenBalances
      : {
        address: accountAddress,
        token,
        balance
      } satisfies AccountTokenBalance;

    loggerProvider.logger.log(`The Etherlink native token balance for the ${accountAddress} address is ${balance}`);

    return accountTokenBalanceOrBalances;
  }

  protected ensureNoRPCErrors<TData>(response: RPCNodeResponse<TData>) {
    if (!response.error)
      return;

    const error = new EtherlinkNodeRPCError(response.error);
    loggerProvider.logger.error(getErrorLogMessage(error));

    throw error;
  }
}
