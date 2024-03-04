import { TokenBalanceDto } from './dtos';
import { TzKTTokenBalanceNotSupported } from './errors';
import * as mappers from './mappers';
import { RemoteService } from '../../../common';
import { getTokenLogMessage, loggerProvider } from '../../../logging';
import type { TezosToken, NativeTezosToken, NonNativeTezosToken, FA2TezosToken } from '../../../tokens';
import { guards, tokenUtils } from '../../../utils';
import type { AccountTokenBalance, AccountTokenBalances, TokenBalanceInfo } from '../accountTokenBalances';
import type { BalancesBridgeDataProvider } from '../balancesBridgeDataProvider';
import type { BalancesFetchOptions } from '../balancesFetchOptions';

export class TzKTBalancesProvider extends RemoteService implements BalancesBridgeDataProvider {
  protected static readonly defaultLoadDataLimit = 10000;

  async getBalance(accountAddress: string, token: TezosToken): Promise<AccountTokenBalance> {
    if (!tokenUtils.isTezosToken(token)) {
      const error = new TzKTTokenBalanceNotSupported(token);
      loggerProvider.logger.error(error);
      throw error;
    }

    loggerProvider.lazyLogger.log?.(`Getting balance of the ${getTokenLogMessage(token)} token for the ${accountAddress} address`);

    const accountTokenBalance = await (token.type === 'native'
      ? this.getNativeTezosTokenAccountBalance(accountAddress, false)
      : this.getNonNativeTezosTokenBalance(accountAddress, token));

    loggerProvider.lazyLogger.log?.(`The balance of the ${getTokenLogMessage(token)} token for the ${accountAddress} address is ${accountTokenBalance.balance}`);

    return accountTokenBalance;
  }

  async getBalances(accountAddress: string): Promise<AccountTokenBalances>;
  async getBalances(accountAddress: string, tokens: readonly TezosToken[]): Promise<AccountTokenBalances>;
  async getBalances(accountAddress: string, fetchOptions: BalancesFetchOptions): Promise<AccountTokenBalances>;
  async getBalances(accountAddress: string, tokensOrFetchOptions?: readonly TezosToken[] | BalancesFetchOptions): Promise<AccountTokenBalances>;
  async getBalances(accountAddress: string, tokensOrFetchOptions?: readonly TezosToken[] | BalancesFetchOptions): Promise<AccountTokenBalances> {
    return guards.isReadonlyArray(tokensOrFetchOptions)
      ? this.getTezosTokenBalances(accountAddress, tokensOrFetchOptions)
      : this.getAllTokenBalances(accountAddress, tokensOrFetchOptions?.offset, tokensOrFetchOptions?.limit);
  }

  protected async getAllTokenBalances(accountAddress: string, offset?: number, limit?: number) {
    loggerProvider.logger.log(`Getting balances of the all tokens for the ${accountAddress} address`);

    let accountTokenBalances: AccountTokenBalances;

    if (!offset) {
      const [nativeTokenAccountTokenBalances, nonNativeTezosTokenAccountTokenBalances] = await Promise.all([
        this.getNativeTezosTokenAccountBalance(accountAddress, true),
        this.getNonNativeTezosTokenBalances(accountAddress, null, offset, limit)
      ]);
      accountTokenBalances = nonNativeTezosTokenAccountTokenBalances;
      (accountTokenBalances.tokenBalances as TokenBalanceInfo[]).unshift(nativeTokenAccountTokenBalances.tokenBalances[0]!);
    }
    else {
      accountTokenBalances = await this.getNonNativeTezosTokenBalances(accountAddress, null, offset, limit);
    }

    loggerProvider.logger.log(`The balances of the all tokens for the ${accountAddress} address has been received`);

    return accountTokenBalances;
  }

  protected async getTezosTokenBalances(accountAddress: string, tokens: readonly TezosToken[]) {
    const { nativeToken, nonNativeTezosTokens } = this.splitTokensToNativeAndNonNativeTokens(tokens);

    let nativeTokenAccountTokenBalances: AccountTokenBalances | undefined = undefined;
    let nonNativeTezosTokenAccountTokenBalances: AccountTokenBalances | undefined = undefined;

    loggerProvider.lazyLogger.log?.(`Getting balances of the ${getTokenLogMessage(tokens)} tokens for the ${accountAddress} address`);

    if (nativeToken && nonNativeTezosTokens.length > 1) {
      [nativeTokenAccountTokenBalances, nonNativeTezosTokenAccountTokenBalances] = await Promise.all([
        this.getNativeTezosTokenAccountBalance(accountAddress, true),
        this.getNonNativeTezosTokenBalances(accountAddress, nonNativeTezosTokens)
      ]);
    }
    else if (nativeToken) {
      nativeTokenAccountTokenBalances = await this.getNativeTezosTokenAccountBalance(accountAddress, true);
    }
    else {
      nonNativeTezosTokenAccountTokenBalances = await this.getNonNativeTezosTokenBalances(accountAddress, nonNativeTezosTokens);
    }

    let accountTokenBalances: AccountTokenBalances;
    if (nativeTokenAccountTokenBalances && nonNativeTezosTokenAccountTokenBalances) {
      accountTokenBalances = nonNativeTezosTokenAccountTokenBalances;
      (accountTokenBalances.tokenBalances as TokenBalanceInfo[]).unshift(nativeTokenAccountTokenBalances.tokenBalances[0]!);
    }
    else if (nativeTokenAccountTokenBalances) {
      accountTokenBalances = nativeTokenAccountTokenBalances;
    }
    else {
      accountTokenBalances = nonNativeTezosTokenAccountTokenBalances!;
    }

    loggerProvider.lazyLogger.log?.(`The balances of the ${getTokenLogMessage(tokens)} tokens for the ${accountAddress} address has been received`);

    return accountTokenBalances;
  }

  protected async getNonNativeTezosTokenBalance(
    address: string,
    token: NonNativeTezosToken
  ): Promise<AccountTokenBalance> {
    const queryParams = this.getNonNativeTezosTokenBalancesQueryParams(address, token);
    const queryParamsString = decodeURIComponent(queryParams.toString());

    const tokenBalanceDtos = await this.fetch<TokenBalanceDto[]>(
      `/v1/tokens/balances?${queryParamsString}`,
      'json'
    );

    loggerProvider.logger.debug('Mapping the tokenBalanceDTOs to AccountTokenBalances...');

    const accountTokenBalance = mappers.mapTokenBalanceDtosToAccountTokenBalance(tokenBalanceDtos);
    loggerProvider.logger.debug('Mapping has been completed.');

    return accountTokenBalance || {
      address,
      token,
      balance: 0n
    } satisfies AccountTokenBalance;
  }

  protected async getNonNativeTezosTokenBalances(
    address: string,
    tokenOrTokens: NonNativeTezosToken | readonly NonNativeTezosToken[] | null | undefined,
    offset?: number,
    limit?: number
  ): Promise<AccountTokenBalances> {
    const queryParams = this.getNonNativeTezosTokenBalancesQueryParams(address, tokenOrTokens);
    if (offset && offset > 0)
      queryParams.append('offset', offset.toString());
    if (limit && limit > 0 && limit < TzKTBalancesProvider.defaultLoadDataLimit)
      queryParams.append('limit', limit.toString());

    const queryParamsString = decodeURIComponent(queryParams.toString());

    const tokenBalanceDtos = await this.fetch<TokenBalanceDto[]>(
      `/v1/tokens/balances?${queryParamsString}`,
      'json'
    );

    loggerProvider.logger.debug('Mapping the tokenBalanceDTOs to AccountTokenBalances...');

    const accountTokenBalances = mappers.mapTokenBalanceDtosToAccountTokenBalances(tokenBalanceDtos);
    loggerProvider.logger.debug('Mapping has been completed.');

    return accountTokenBalances || {
      address,
      tokenBalances: []
    } satisfies AccountTokenBalances;
  }

  protected async getNativeTezosTokenAccountBalance(address: string, isBalances: false): Promise<AccountTokenBalance>;
  protected async getNativeTezosTokenAccountBalance(address: string, isBalances: true): Promise<AccountTokenBalances>;
  protected async getNativeTezosTokenAccountBalance(address: string, isBalances: boolean): Promise<AccountTokenBalance | AccountTokenBalances> {
    const rawBalance = await this.fetch<number>(`/v1/accounts/${address}/balance`, 'text');
    const token: NativeTezosToken = { type: 'native' };
    const balance = BigInt(rawBalance);

    return isBalances
      ? {
        address,
        tokenBalances: [{
          token,
          balance
        }]
      }
      : {
        address,
        token,
        balance
      };
  }

  protected getNonNativeTezosTokenBalancesQueryParams(
    address: string,
    tokenOrTokens: NonNativeTezosToken | readonly NonNativeTezosToken[] | null | undefined
  ): URLSearchParams {
    if (!tokenOrTokens) {
      return new URLSearchParams({
        account: address
      });
    }

    const token = guards.isReadonlyArray(tokenOrTokens)
      ? tokenOrTokens.length === 1 ? tokenOrTokens[0] : undefined
      : tokenOrTokens;
    if (token) {
      return new URLSearchParams({
        'account': address,
        'token.contract': token.address,
        'token.tokenId': (token as FA2TezosToken).tokenId || '0'
      });
    }

    const addressesSet = new Set<string>();
    const tokenIdsSet = new Set<string>();

    for (const token of tokenOrTokens as readonly NonNativeTezosToken[]) {
      addressesSet.add(token.address);
      tokenIdsSet.add((token as FA2TezosToken).tokenId || '0');
    }

    const addresses = [...addressesSet].join(',');
    const tokenIds = [...tokenIdsSet].join(',');

    return new URLSearchParams({
      'account': address,
      'token.contract.in': addresses,
      'token.tokenId.in': tokenIds
    });
  }

  protected splitTokensToNativeAndNonNativeTokens(
    tokens: readonly TezosToken[]
  ): { nativeToken?: NativeTezosToken; nonNativeTezosTokens: NonNativeTezosToken[] } {
    let nativeToken: NativeTezosToken | undefined;
    const nonNativeTezosTokens: NonNativeTezosToken[] = [];

    for (const token of tokens) {
      if (token.type === 'native')
        nativeToken = token;
      else
        nonNativeTezosTokens.push(token);
    }

    return {
      nativeToken,
      nonNativeTezosTokens
    };
  }
}
