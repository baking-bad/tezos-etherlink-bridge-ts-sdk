import type { DefaultDataProviderOptions } from './defaultDataProviderOptions';
import type { BridgeTokenTransfer, TokenPair } from '../../bridgeCore';
import type {
  TezosToken, NativeTezosToken, NonNativeTezosToken,
  EtherlinkToken, NativeEtherlinkToken, NonNativeEtherlinkToken
} from '../../tokens';
import { guards, memoize } from '../../utils';
import {
  TzKTBalancesProvider, EtherlinkNodeBalancesProvider,
  type AccountTokenBalance, type AccountTokenBalances, type BalancesBridgeDataProvider, type BalancesFetchOptions
} from '../balancesBridgeDataProvider';
import { DipDupBridgeDataProvider } from '../dipDupBridgeDataProvider';
import { LocalTokensBridgeDataProvider, type TokensBridgeDataProvider, type TokensFetchOptions } from '../tokensBridgeDataProvider';
import type { TransfersBridgeDataProvider, TransfersFetchOptions } from '../transfersBridgeDataProvider';

interface TokenGroups {
  nativeTokens: Array<NativeTezosToken | NativeEtherlinkToken>;
  nonNativeEtherlinkTokens: NonNativeEtherlinkToken[];
  nonNativeTezosTokens: NonNativeTezosToken[];
}

const nativeToken: NativeTezosToken | NativeEtherlinkToken = { type: 'native' };
const nativeTokenArray = [nativeToken] as const;

export class DefaultDataProvider implements TransfersBridgeDataProvider, BalancesBridgeDataProvider, TokensBridgeDataProvider, Disposable {
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

  async getTokenTransfer(tokenTransferId: string): Promise<BridgeTokenTransfer | null> {
    return this.dipDupBridgeDataProvider.getTokenTransfer(tokenTransferId);
  }

  async getTokenTransfers(): Promise<BridgeTokenTransfer[]>;
  async getTokenTransfers(fetchOptions: TransfersFetchOptions): Promise<BridgeTokenTransfer[]>;
  async getTokenTransfers(fetchOptions?: TransfersFetchOptions): Promise<BridgeTokenTransfer[]>;
  async getTokenTransfers(fetchOptions?: TransfersFetchOptions): Promise<BridgeTokenTransfer[]> {
    return this.dipDupBridgeDataProvider.getTokenTransfers(fetchOptions);
  }

  async getAccountTokenTransfers(accountAddress: string): Promise<BridgeTokenTransfer[]>;
  async getAccountTokenTransfers(accountAddresses: readonly string[]): Promise<BridgeTokenTransfer[]>;
  async getAccountTokenTransfers(accountAddress: string, fetchOptions: TransfersFetchOptions): Promise<BridgeTokenTransfer[]>;
  async getAccountTokenTransfers(accountAddresses: readonly string[], fetchOptions: TransfersFetchOptions): Promise<BridgeTokenTransfer[]>;
  async getAccountTokenTransfers(accountAddressOrAddresses: string | readonly string[], fetchOptions?: TransfersFetchOptions): Promise<BridgeTokenTransfer[]>;
  async getAccountTokenTransfers(accountAddressOrAddresses: string | readonly string[], fetchOptions?: TransfersFetchOptions): Promise<BridgeTokenTransfer[]> {
    return this.dipDupBridgeDataProvider.getAccountTokenTransfers(accountAddressOrAddresses, fetchOptions);
  }

  async getOperationTokenTransfers(operationHash: string): Promise<BridgeTokenTransfer[]>;
  async getOperationTokenTransfers(tokenTransfer: BridgeTokenTransfer): Promise<BridgeTokenTransfer[]>;
  async getOperationTokenTransfers(operationHashOrTokenTransfer: string | BridgeTokenTransfer): Promise<BridgeTokenTransfer[]>;
  async getOperationTokenTransfers(operationHashOrTokenTransfer: string | BridgeTokenTransfer): Promise<BridgeTokenTransfer[]> {
    return this.dipDupBridgeDataProvider.getOperationTokenTransfers(operationHashOrTokenTransfer);
  }

  subscribeToTokenTransfer(tokenTransferId: string): void {
    return this.dipDupBridgeDataProvider.subscribeToTokenTransfer(tokenTransferId);
  }

  unsubscribeFromTokenTransfer(tokenTransferId: string): void {
    return this.dipDupBridgeDataProvider.unsubscribeFromTokenTransfer(tokenTransferId);
  }

  subscribeToTokenTransfers(): void {
    return this.dipDupBridgeDataProvider.subscribeToTokenTransfers();
  }

  unsubscribeFromTokenTransfers(): void {
    return this.dipDupBridgeDataProvider.unsubscribeFromTokenTransfers();
  }

  subscribeToAccountTokenTransfers(accountAddress: string): void;
  subscribeToAccountTokenTransfers(accountAddresses: readonly string[]): void;
  subscribeToAccountTokenTransfers(accountAddressOrAddresses: string | readonly string[]): void;
  subscribeToAccountTokenTransfers(accountAddressOrAddresses: string | readonly string[]): void {
    return this.dipDupBridgeDataProvider.subscribeToAccountTokenTransfers(accountAddressOrAddresses);
  }

  unsubscribeFromAccountTokenTransfers(accountAddress: string): void;
  unsubscribeFromAccountTokenTransfers(accountAddresses: readonly string[]): void;
  unsubscribeFromAccountTokenTransfers(accountAddressOrAddresses: string | readonly string[]): void;
  unsubscribeFromAccountTokenTransfers(accountAddressOrAddresses: string | readonly string[]): void {
    return this.dipDupBridgeDataProvider.unsubscribeFromAccountTokenTransfers(accountAddressOrAddresses);
  }

  subscribeToOperationTokenTransfers(operationHash: string): void;
  subscribeToOperationTokenTransfers(tokenTransfer: BridgeTokenTransfer): void;
  subscribeToOperationTokenTransfers(operationHashOrTokenTransfer: string | BridgeTokenTransfer): void;
  subscribeToOperationTokenTransfers(operationHashOrTokenTransfer: string | BridgeTokenTransfer): void {
    return this.dipDupBridgeDataProvider.subscribeToOperationTokenTransfers(operationHashOrTokenTransfer);
  }

  unsubscribeFromOperationTokenTransfers(operationHash: string): void;
  unsubscribeFromOperationTokenTransfers(tokenTransfer: BridgeTokenTransfer): void;
  unsubscribeFromOperationTokenTransfers(operationHashOrTokenTransfer: string | BridgeTokenTransfer): void;
  unsubscribeFromOperationTokenTransfers(operationHashOrTokenTransfer: string | BridgeTokenTransfer): void {
    return this.dipDupBridgeDataProvider.unsubscribeFromOperationTokenTransfers(operationHashOrTokenTransfer);
  }

  unsubscribeFromAllSubscriptions(): void {
    return this.dipDupBridgeDataProvider.unsubscribeFromAllSubscriptions();
  }

  async getBalances(accountAddress: string): Promise<AccountTokenBalances>;
  async getBalances(accountAddress: string, tokens: ReadonlyArray<TezosToken | EtherlinkToken>): Promise<AccountTokenBalances>;
  async getBalances(accountAddress: string, fetchOptions: BalancesFetchOptions): Promise<AccountTokenBalances>;
  async getBalances(accountAddress: string, tokensOrFetchOptions?: ReadonlyArray<TezosToken | EtherlinkToken> | BalancesFetchOptions): Promise<AccountTokenBalances>;
  async getBalances(accountAddress: string, tokensOrFetchOptions?: ReadonlyArray<TezosToken | EtherlinkToken> | BalancesFetchOptions): Promise<AccountTokenBalances> {
    const isEtherlinkAccount = this.isEtherlinkAccount(accountAddress);
    const tokenGroups = guards.isReadonlyArray(tokensOrFetchOptions) ? this.groupTokens(tokensOrFetchOptions) : null;
    const promises: Array<Promise<AccountTokenBalances>> = [];

    if (isEtherlinkAccount) {
      if (tokenGroups) {
        if (tokenGroups.nativeTokens.length)
          promises.push(this.etherlinkNodeBalancesDataProvider.getBalances(accountAddress, tokenGroups.nativeTokens));
        if (tokenGroups.nonNativeEtherlinkTokens.length)
          promises.push(this.dipDupBridgeDataProvider.getBalances(accountAddress, tokenGroups.nonNativeEtherlinkTokens));
      }
      else {
        if (!(tokensOrFetchOptions as BalancesFetchOptions | undefined)?.offset)
          promises.push(this.etherlinkNodeBalancesDataProvider.getBalances(accountAddress, nativeTokenArray));
        promises.push(this.dipDupBridgeDataProvider.getBalances(accountAddress, tokensOrFetchOptions as BalancesFetchOptions | undefined));
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
        promises.push(this.tzKTBalancesDataProvider.getBalances(accountAddress, tokensOrFetchOptions as BalancesFetchOptions | undefined));
      }
    }

    if (!promises.length) {
      return {
        address: accountAddress,
        tokenBalances: []
      };
    }

    const accountTokenBalanceResults = await Promise.allSettled(promises);
    const accountTokenBalances = [];

    for (const accountTokenBalanceResult of accountTokenBalanceResults) {
      if (accountTokenBalanceResult.status === 'fulfilled')
        accountTokenBalances.push(accountTokenBalanceResult.value);
    }

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
  getRegisteredTokenPairs(fetchOptions: TokensFetchOptions): Promise<TokenPair[]>;
  getRegisteredTokenPairs(fetchOptions?: TokensFetchOptions): Promise<TokenPair[]>;
  getRegisteredTokenPairs(fetchOptions?: TokensFetchOptions): Promise<TokenPair[]> {
    return this.bridgeDataProvider.getRegisteredTokenPairs(fetchOptions);
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

  [Symbol.dispose](): void {
    this.dipDupBridgeDataProvider[Symbol.dispose]();
  }

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
