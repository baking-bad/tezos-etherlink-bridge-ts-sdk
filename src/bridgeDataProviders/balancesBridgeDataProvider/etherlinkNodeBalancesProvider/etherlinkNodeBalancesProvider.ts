import type { BalanceData, RPCNodeResponse } from './dto';
import { EtherlinkNodeRPCError, EtherlinkNodeTokenBalanceNotSupported } from './error';
import { RemoteService } from '../../../common';
import type { NativeEtherlinkToken } from '../../../etherlink';
import { getErrorLogMessage, loggerProvider } from '../../../logging';
import type { AccountTokenBalanceInfo } from '../accountTokenBalanceInfo';
import type { BalancesBridgeDataProvider } from '../balancesBridgeDataProvider';

export class EtherlinkNodeBalancesProvider extends RemoteService implements BalancesBridgeDataProvider {
  async getBalance(accountAddress: string, token: NativeEtherlinkToken): Promise<AccountTokenBalanceInfo> {
    if (token.type !== 'native') {
      const error = new EtherlinkNodeTokenBalanceNotSupported(token);
      loggerProvider.logger.error(error);
      throw error;
    }

    return this.getNativeEtherlinkTokenBalance(accountAddress);
  }

  async getBalances(accountAddress: string): Promise<AccountTokenBalanceInfo>;
  async getBalances(accountAddress: string, tokens: readonly NativeEtherlinkToken[]): Promise<AccountTokenBalanceInfo>;
  async getBalances(accountAddress: string, offset: number, limit: number): Promise<AccountTokenBalanceInfo>;
  async getBalances(accountAddress: string, tokensOrOffset?: readonly NativeEtherlinkToken[] | number, limit?: number): Promise<AccountTokenBalanceInfo>;
  async getBalances(
    accountAddress: string,
    tokensOrOffset?: readonly NativeEtherlinkToken[] | number,
    _limit?: number
  ): Promise<AccountTokenBalanceInfo> {
    const isAllTokens = typeof tokensOrOffset === 'number' || !tokensOrOffset;

    if (!isAllTokens && tokensOrOffset.length && tokensOrOffset[0]!.type !== 'native') {
      const error = new EtherlinkNodeTokenBalanceNotSupported(tokensOrOffset[0]!);
      loggerProvider.logger.error(error);
      throw error;
    }

    return this.getNativeEtherlinkTokenBalance(accountAddress);
  }

  protected async getNativeEtherlinkTokenBalance(accountAddress: string): Promise<AccountTokenBalanceInfo> {
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

    const accountTokenBalanceInfo: AccountTokenBalanceInfo = {
      address: accountAddress,
      tokenBalances: [{
        token: { type: 'native' },
        balance: BigInt(getBalanceResponse.result)
      }]
    };

    loggerProvider.logger.log(`The Etherlink native token balance for the ${accountAddress} address is ${accountTokenBalanceInfo.tokenBalances[0]?.balance}`);

    return accountTokenBalanceInfo;
  }

  protected ensureNoRPCErrors<TData>(response: RPCNodeResponse<TData>) {
    if (!response.error)
      return;

    const error = new EtherlinkNodeRPCError(response.error);
    loggerProvider.logger.error(getErrorLogMessage(error));

    throw error;
  }
}
