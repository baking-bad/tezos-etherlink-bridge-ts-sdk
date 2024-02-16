import type { DefaultDataProviderOptions } from './defaultDataProviderOptions';
import type { BridgeTokenTransfer, TokenPair } from '../../bridgeCore';
import type { EtherlinkToken, NativeEtherlinkToken, NonNativeEtherlinkToken } from '../../etherlink';
import type { TezosToken, NativeTezosToken, NonNativeTezosToken } from '../../tezos';
import { guards, memoize } from '../../utils';
import {
  TzKTBalancesProvider, EtherlinkNodeBalancesProvider,
  type AccountTokenBalance, type AccountTokenBalances, type BalancesBridgeDataProvider
} from '../balancesBridgeDataProvider';
import { DipDupBridgeDataProvider } from '../dipDupBridgeDataProvider';
import { LocalTokensBridgeDataProvider, type TokensBridgeDataProvider } from '../tokensBridgeDataProvider';
import type { TransfersBridgeDataProvider } from '../transfersBridgeDataProvider';

interface TokenGroups {
  nativeTokens: Array<NativeTezosToken | NativeEtherlinkToken>;
  nonNativeEtherlinkTokens: NonNativeEtherlinkToken[];
  nonNativeTezosTokens: NonNativeTezosToken[];
}

const nativeToken: NativeTezosToken | NativeEtherlinkToken = { type: 'native' };
const nativeTokenArray = [nativeToken] as const;

export class DefaultDataProvider implements TransfersBridgeDataProvider, BalancesBridgeDataProvider, TokensBridgeDataProvider {
  protected readonly bridgeDataProvider: TokensBridgeDataProvider;
  protected readonly dipDupBridgeDataProvider: DipDupBridgeDataProvider;
  protected readonly tzKTBalancesDataProvider: TzKTBalancesProvider;
  protected readonly etherlinkNodeBalancesDataProvider: EtherlinkNodeBalancesProvider;

  constructor(options: DefaultDataProviderOptions) {
    this.bridgeDataProvider = guards.isReadonlyArray(options.tokenPairs)
      ? new LocalTokensBridgeDataProvider(options.tokenPairs)
      : options.tokenPairs;
    this.dipDupBridgeDataProvider = new DipDupBridgeDataProvider({
      baseUrl: options.dipDup.baseUrl,
      autoUpdate: {
        type: 'websocket',
        webSocketApiBaseUrl: options.dipDup.webSocketApiBaseUrl,
        startImmediately: false
      }
    });
    this.tzKTBalancesDataProvider = new TzKTBalancesProvider(options.tzKTApiBaseUrl);
    this.etherlinkNodeBalancesDataProvider = new EtherlinkNodeBalancesProvider(options.etherlinkRpcUrl);
  }

  get events(): TransfersBridgeDataProvider['events'] {
    return this.dipDupBridgeDataProvider.events;
  }

  async getTokenTransfer(operationHash: string): Promise<BridgeTokenTransfer | null>;
  async getTokenTransfer(tokenTransfer: BridgeTokenTransfer): Promise<BridgeTokenTransfer | null>;
  async getTokenTransfer(operationHashOrTokenTransfer: string | BridgeTokenTransfer): Promise<BridgeTokenTransfer | null>;
  async getTokenTransfer(operationHashOrTokenTransfer: string | BridgeTokenTransfer): Promise<BridgeTokenTransfer | null> {
    return this.dipDupBridgeDataProvider.getTokenTransfer(operationHashOrTokenTransfer);
  }

  async getTokenTransfers(): Promise<BridgeTokenTransfer[]>;
  async getTokenTransfers(offset: number, limit: number): Promise<BridgeTokenTransfer[]>;
  async getTokenTransfers(offset?: number, limit?: number): Promise<BridgeTokenTransfer[]>;
  async getTokenTransfers(offset?: number, limit?: number): Promise<BridgeTokenTransfer[]> {
    return this.dipDupBridgeDataProvider.getTokenTransfers(offset, limit);
  }

  async getAccountTokenTransfers(accountAddress: string): Promise<BridgeTokenTransfer[]>;
  async getAccountTokenTransfers(accountAddresses: readonly string[]): Promise<BridgeTokenTransfer[]>;
  async getAccountTokenTransfers(accountAddress: string, offset: number, limit: number): Promise<BridgeTokenTransfer[]>;
  async getAccountTokenTransfers(accountAddresses: readonly string[], offset: number, limit: number): Promise<BridgeTokenTransfer[]>;
  async getAccountTokenTransfers(accountAddressOfAddresses: string | readonly string[], offset?: number, limit?: number): Promise<BridgeTokenTransfer[]>;
  async getAccountTokenTransfers(accountAddressOfAddresses: string | readonly string[], offset?: number, limit?: number): Promise<BridgeTokenTransfer[]> {
    return this.dipDupBridgeDataProvider.getAccountTokenTransfers(accountAddressOfAddresses, offset, limit);
  }

  subscribeToTokenTransfer(operationHash: string): void;
  subscribeToTokenTransfer(tokenTransfer: BridgeTokenTransfer): void;
  subscribeToTokenTransfer(operationHashOrTokenTransfer: string | BridgeTokenTransfer): void;
  subscribeToTokenTransfer(operationHashOrTokenTransfer: string | BridgeTokenTransfer): void {
    return this.dipDupBridgeDataProvider.subscribeToTokenTransfer(operationHashOrTokenTransfer);
  }

  unsubscribeFromTokenTransfer(operationHash: string): void;
  unsubscribeFromTokenTransfer(tokenTransfer: BridgeTokenTransfer): void;
  unsubscribeFromTokenTransfer(operationHashOrTokenTransfer: string | BridgeTokenTransfer): void;
  unsubscribeFromTokenTransfer(operationHashOrTokenTransfer: string | BridgeTokenTransfer): void {
    return this.dipDupBridgeDataProvider.unsubscribeFromTokenTransfer(operationHashOrTokenTransfer);
  }

  subscribeToTokenTransfers(): void {
    return this.dipDupBridgeDataProvider.subscribeToTokenTransfers();
  }

  unsubscribeFromTokenTransfers(): void {
    return this.dipDupBridgeDataProvider.unsubscribeFromTokenTransfers();
  }

  subscribeToAccountTokenTransfers(accountAddress: string): void;
  subscribeToAccountTokenTransfers(accountAddresses: readonly string[]): void;
  subscribeToAccountTokenTransfers(accountAddressOrAddresses?: string | readonly string[]): void;
  subscribeToAccountTokenTransfers(accountAddressOrAddresses?: string | readonly string[]): void {
    return this.dipDupBridgeDataProvider.subscribeToAccountTokenTransfers(accountAddressOrAddresses);
  }

  unsubscribeFromAccountTokenTransfers(): void;
  unsubscribeFromAccountTokenTransfers(accountAddress: string): void;
  unsubscribeFromAccountTokenTransfers(accountAddresses: readonly string[]): void;
  unsubscribeFromAccountTokenTransfers(accountAddressOrAddresses?: string | readonly string[]): void;
  unsubscribeFromAccountTokenTransfers(accountAddressOrAddresses?: string | readonly string[]): void {
    return this.dipDupBridgeDataProvider.unsubscribeFromAccountTokenTransfers(accountAddressOrAddresses);
  }

  unsubscribeFromAllSubscriptions(): void {
    return this.dipDupBridgeDataProvider.unsubscribeFromAllSubscriptions();
  }

  async getBalances(accountAddress: string): Promise<AccountTokenBalances>;
  async getBalances(accountAddress: string, tokens: ReadonlyArray<TezosToken | EtherlinkToken>): Promise<AccountTokenBalances>;
  async getBalances(accountAddress: string, offset: number, limit: number): Promise<AccountTokenBalances>;
  async getBalances(accountAddress: string, tokensOrOffset?: number | ReadonlyArray<TezosToken | EtherlinkToken> | undefined, limit?: number | undefined): Promise<AccountTokenBalances>;
  async getBalances(accountAddress: string, tokensOrOffset?: number | ReadonlyArray<TezosToken | EtherlinkToken> | undefined, limit?: number | undefined): Promise<AccountTokenBalances> {
    const isEtherlinkAccount = this.isEtherlinkAccount(accountAddress);
    const tokenGroups = typeof tokensOrOffset === 'number' || !tokensOrOffset ? null : this.groupTokens(tokensOrOffset);
    const promises: Array<Promise<AccountTokenBalances>> = [];

    if (isEtherlinkAccount) {
      if (tokenGroups) {
        if (tokenGroups.nativeTokens.length)
          promises.push(this.etherlinkNodeBalancesDataProvider.getBalances(accountAddress, tokenGroups.nativeTokens));
        if (tokenGroups.nonNativeEtherlinkTokens.length)
          promises.push(this.dipDupBridgeDataProvider.getBalances(accountAddress, tokenGroups.nonNativeEtherlinkTokens));
      }
      else {
        if (!tokensOrOffset)
          promises.push(this.etherlinkNodeBalancesDataProvider.getBalances(accountAddress, nativeTokenArray));
        promises.push(this.dipDupBridgeDataProvider.getBalances(accountAddress, tokensOrOffset as number, limit));
      }
    }
    else {
      if (tokenGroups) {
        if (tokenGroups.nativeTokens.length)
          promises.push(this.tzKTBalancesDataProvider.getBalances(accountAddress, tokenGroups.nativeTokens));
        if (tokenGroups.nonNativeTezosTokens.length)
          promises.push(this.tzKTBalancesDataProvider.getBalances(accountAddress, tokenGroups.nonNativeTezosTokens));
      }
      else {
        promises.push(this.tzKTBalancesDataProvider.getBalances(accountAddress, tokensOrOffset as number, limit));
      }
    }

    if (!promises.length) {
      return {
        address: accountAddress,
        tokenBalances: []
      };
    }

    const accountTokenBalances = await Promise.all(promises);
    return this.mergeAccountTokenBalances(accountTokenBalances);
  }

  getBalance(accountAddress: string, token: TezosToken | EtherlinkToken): Promise<AccountTokenBalance> {
    return this.isEtherlinkAccount(accountAddress)
      ? token.type === 'native'
        ? this.etherlinkNodeBalancesDataProvider.getBalance(accountAddress, token)
        : this.dipDupBridgeDataProvider.getBalance(accountAddress, token as NonNativeEtherlinkToken)
      : this.tzKTBalancesDataProvider.getBalance(accountAddress, token as TezosToken);
  }

  getRegisteredTokenPair(token: TezosToken | EtherlinkToken): Promise<TokenPair | null> {
    return this.bridgeDataProvider.getRegisteredTokenPair(token);
  }

  getRegisteredTokenPairs(): Promise<TokenPair[]>;
  getRegisteredTokenPairs(offset: number, limit: number): Promise<TokenPair[]>;
  getRegisteredTokenPairs(offset?: number, limit?: number): Promise<TokenPair[]>;
  getRegisteredTokenPairs(offset?: number, limit?: number): Promise<TokenPair[]> {
    return this.bridgeDataProvider.getRegisteredTokenPairs(offset, limit);
  }

  protected groupTokens = memoize((tokens: ReadonlyArray<TezosToken | EtherlinkToken>): TokenGroups => {
    const tokenGroups: TokenGroups = {
      nativeTokens: [],
      nonNativeEtherlinkTokens: [],
      nonNativeTezosTokens: []
    };

    for (const token of tokens) {
      if (token.type === 'native')
        tokenGroups.nativeTokens.push(token);
      else if (token.type === 'erc20')
        tokenGroups.nonNativeEtherlinkTokens.push(token);
      else
        tokenGroups.nonNativeTezosTokens.push(token);
    }

    return tokenGroups;
  });

  protected mergeAccountTokenBalances(accountTokenBalances: readonly AccountTokenBalances[]): AccountTokenBalances {
    if (!accountTokenBalances.length)
      throw new Error('It\'s not possible to merge an empty array for the AccountTokenBalances');

    return {
      address: accountTokenBalances[0]!.address,
      tokenBalances: accountTokenBalances.flatMap(info => info.tokenBalances)
    };
  }

  private isEtherlinkAccount(accountAddress: string) {
    return accountAddress.startsWith('0x');
  }
}
