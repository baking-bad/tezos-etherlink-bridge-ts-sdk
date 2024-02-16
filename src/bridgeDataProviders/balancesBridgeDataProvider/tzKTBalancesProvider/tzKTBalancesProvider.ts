import { TokenBalanceDto } from './dtos';
import { TzKTNotPossibleReceiveBalances, TzKTTokenBalanceNotSupported } from './errors';
import * as mappers from './mappers';
import { RemoteService } from '../../../common';
import { getTokenLogMessage, loggerProvider } from '../../../logging';
import type { TezosToken, NativeTezosToken, NonNativeTezosToken, FA2TezosToken } from '../../../tezos';
import { guards, tokenUtils } from '../../../utils';
import type { AccountTokenBalanceInfo, TokenBalanceInfo } from '../accountTokenBalanceInfo';
import type { BalancesBridgeDataProvider } from '../balancesBridgeDataProvider';

export class TzKTBalancesProvider extends RemoteService implements BalancesBridgeDataProvider {
  protected static readonly defaultLoadDataLimit = 10000;

  async getBalance(accountAddress: string, token: TezosToken): Promise<AccountTokenBalanceInfo> {
    if (!tokenUtils.isTezosToken(token)) {
      const error = new TzKTTokenBalanceNotSupported(token);
      loggerProvider.logger.error(error);
      throw error;
    }

    loggerProvider.lazyLogger.log?.(`Getting balance of the ${getTokenLogMessage(token)} token for the ${accountAddress} address`);

    const accountTokenBalanceInfo = await (token.type === 'native'
      ? this.getNativeTezosTokenAccountBalance(accountAddress)
      : this.getNonNativeTezosTokenBalances(accountAddress, token));

    loggerProvider.lazyLogger.log?.(`The balance of the ${getTokenLogMessage(token)} token for the ${accountAddress} address is ${accountTokenBalanceInfo.tokenBalances[0]?.balance}`);

    return accountTokenBalanceInfo;
  }

  async getBalances(accountAddress: string): Promise<AccountTokenBalanceInfo>;
  async getBalances(accountAddress: string, tokens: readonly TezosToken[]): Promise<AccountTokenBalanceInfo>;
  async getBalances(accountAddress: string, offset: number, limit: number): Promise<AccountTokenBalanceInfo>;
  async getBalances(accountAddress: string, tokensOrOffset?: readonly TezosToken[] | number, limit?: number): Promise<AccountTokenBalanceInfo>;
  async getBalances(
    accountAddress: string,
    tokensOrOffset?: readonly TezosToken[] | number,
    limit?: number
  ): Promise<AccountTokenBalanceInfo> {
    return typeof tokensOrOffset === 'number' || !tokensOrOffset
      ? this.getAllTokenBalances(accountAddress, tokensOrOffset, limit)
      : this.getTezosTokenBalances(accountAddress, tokensOrOffset);
  }

  protected async getAllTokenBalances(accountAddress: string, offset?: number, limit?: number) {
    loggerProvider.logger.log(`Getting balances of the all tokens for the ${accountAddress} address`);

    let accountTokenBalanceInfo: AccountTokenBalanceInfo;

    if (!offset) {
      const [nativeTokenAccountTokenBalanceInfo, nonNativeTezosTokenAccountTokenBalanceInfos] = await Promise.all([
        this.getNativeTezosTokenAccountBalance(accountAddress),
        this.getNonNativeTezosTokenBalances(accountAddress, null, offset, limit)
      ]);
      accountTokenBalanceInfo = nonNativeTezosTokenAccountTokenBalanceInfos;
      (accountTokenBalanceInfo.tokenBalances as TokenBalanceInfo[]).unshift(nativeTokenAccountTokenBalanceInfo.tokenBalances[0]!);
    }
    else {
      accountTokenBalanceInfo = await this.getNonNativeTezosTokenBalances(accountAddress, null, offset, limit);
    }

    loggerProvider.logger.log(`The balances of the all tokens for the ${accountAddress} address has been received`);

    return accountTokenBalanceInfo;
  }

  protected async getTezosTokenBalances(accountAddress: string, tokens: readonly TezosToken[]) {
    const { nativeToken, nonNativeTezosTokens } = this.splitTokensToNativeAndNonNativeTokens(tokens);

    let nativeTokenAccountTokenBalanceInfo: AccountTokenBalanceInfo | undefined = undefined;
    let nonNativeTezosTokenAccountTokenBalanceInfos: AccountTokenBalanceInfo | undefined = undefined;

    loggerProvider.lazyLogger.log?.(`Getting balances of the ${getTokenLogMessage(tokens)} tokens for the ${accountAddress} address`);

    if (nativeToken && nonNativeTezosTokens.length > 1) {
      [nativeTokenAccountTokenBalanceInfo, nonNativeTezosTokenAccountTokenBalanceInfos] = await Promise.all([
        this.getNativeTezosTokenAccountBalance(accountAddress),
        this.getNonNativeTezosTokenBalances(accountAddress, nonNativeTezosTokens)
      ]);
    }
    else if (nativeToken) {
      nativeTokenAccountTokenBalanceInfo = await this.getNativeTezosTokenAccountBalance(accountAddress);
    }
    else {
      nonNativeTezosTokenAccountTokenBalanceInfos = await this.getNonNativeTezosTokenBalances(accountAddress, nonNativeTezosTokens);
    }

    let accountTokenBalanceInfo: AccountTokenBalanceInfo;
    if (nativeTokenAccountTokenBalanceInfo && nonNativeTezosTokenAccountTokenBalanceInfos) {
      accountTokenBalanceInfo = nonNativeTezosTokenAccountTokenBalanceInfos;
      (accountTokenBalanceInfo.tokenBalances as TokenBalanceInfo[]).unshift(nativeTokenAccountTokenBalanceInfo.tokenBalances[0]!);
    }
    else if (nativeTokenAccountTokenBalanceInfo) {
      accountTokenBalanceInfo = nativeTokenAccountTokenBalanceInfo;
    }
    else {
      accountTokenBalanceInfo = nonNativeTezosTokenAccountTokenBalanceInfos!;
    }

    loggerProvider.lazyLogger.log?.(`The balances of the ${getTokenLogMessage(tokens)} tokens for the ${accountAddress} address has been received`);

    return accountTokenBalanceInfo;
  }

  protected async getNonNativeTezosTokenBalances(
    address: string,
    tokenOrTokens: NonNativeTezosToken | readonly NonNativeTezosToken[] | null | undefined,
    offset?: number,
    limit?: number
  ): Promise<AccountTokenBalanceInfo> {
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

    loggerProvider.logger.debug('Mapping the tokenBalanceDTOs to AccountTokenBalanceInfo...');

    const accountTokenBalanceInfo = mappers.mapTokenBalanceDtosToAccountTokenBalanceInfo(tokenBalanceDtos);
    if (!accountTokenBalanceInfo) {
      const error = new TzKTNotPossibleReceiveBalances(address, tokenOrTokens);
      loggerProvider.logger.error(error);
      throw error;
    }

    loggerProvider.logger.debug('Mapping has been completed.');

    return accountTokenBalanceInfo;
  }

  protected async getNativeTezosTokenAccountBalance(address: string): Promise<AccountTokenBalanceInfo> {
    const balance = await this.fetch<number>(`/v1/accounts/${address}/balance`, 'text');

    return {
      address,
      tokenBalances: [{
        token: { type: 'native' },
        balance: BigInt(balance)
      }]
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

    if (!guards.isReadonlyArray(tokenOrTokens)) {
      return new URLSearchParams({
        'account': address,
        'token.contract': tokenOrTokens.address,
        'token.tokenId': (tokenOrTokens as FA2TezosToken).tokenId || '0'
      });
    }

    const addressesSet = new Set<string>();
    const tokenIdsSet = new Set<string>();

    for (const token of tokenOrTokens) {
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
