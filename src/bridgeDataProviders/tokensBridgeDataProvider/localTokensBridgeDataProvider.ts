import type { TokensBridgeDataProvider } from './tokensBridgeDataProvider';
import type { TokenPairInfo } from '../../bridge';
import type { EtherlinkToken } from '../../etherlink';
import type { TezosToken } from '../../tezos';

type TokenPairsByTokenMap = {
  native?: TokenPairInfo,
  'fa1.2'?: {
    [address: string]: TokenPairInfo;
  }
  erc20?: {
    [address: string]: TokenPairInfo;
  }
  fa2?: {
    [address: string]: {
      [tokenId: string]: TokenPairInfo;
    }
  }
};

type ReadonlyTokenPairsByTokenMap = {
  readonly native?: TokenPairInfo,
  readonly 'fa1.2'?: {
    readonly [address: string]: TokenPairInfo;
  }
  readonly erc20?: {
    readonly [address: string]: TokenPairInfo;
  }
  readonly fa2?: {
    readonly [address: string]: {
      readonly [tokenId: string]: TokenPairInfo;
    }
  }
};


export class LocalTokensBridgeDataProvider implements TokensBridgeDataProvider {
  private readonly tokenPairsByTokenMap: ReadonlyTokenPairsByTokenMap;

  constructor(readonly tokenPairs: readonly TokenPairInfo[]) {
    this.tokenPairsByTokenMap = this.createTokenPairsByTokenMap(tokenPairs);
  }

  getRegisteredTokenPair(token: TezosToken | EtherlinkToken): Promise<TokenPairInfo | null> {
    const tokenPair = token.type === 'native'
      ? this.tokenPairsByTokenMap[token.type]
      : token.type === 'fa1.2' || token.type === 'erc20'
        ? this.tokenPairsByTokenMap[token.type]?.[token.address]
        : token.type === 'fa2'
          ? this.tokenPairsByTokenMap[token.type]?.[token.address]?.[token.tokenId]
          : null;

    return Promise.resolve(tokenPair || null);
  }

  getRegisteredTokenPairs(): Promise<TokenPairInfo[]>;
  getRegisteredTokenPairs(offset: number, limit: number): Promise<TokenPairInfo[]>;
  getRegisteredTokenPairs(offset?: number, limit?: number): Promise<TokenPairInfo[]>;
  getRegisteredTokenPairs(offset?: number, limit?: number): Promise<TokenPairInfo[]> {
    return Promise.resolve(this.tokenPairs.slice(offset, limit && (limit + (offset || 0))));
  }

  private createTokenPairsByTokenMap(tokenPairs: readonly TokenPairInfo[]): TokenPairsByTokenMap {
    const rootMap: TokenPairsByTokenMap = {};

    for (const tokenPair of tokenPairs) {
      // Tezos Part
      if (tokenPair.tezos.token.type === 'native') {
        rootMap.native = tokenPair;
      }
      else {
        if (!rootMap[tokenPair.tezos.token.type])
          rootMap[tokenPair.tezos.token.type] = {};

        if (tokenPair.tezos.token.type === 'fa1.2') {
          rootMap[tokenPair.tezos.token.type]![tokenPair.tezos.token.address] = tokenPair;
        }
        else {
          if (!rootMap[tokenPair.tezos.token.type]![tokenPair.tezos.token.address])
            rootMap[tokenPair.tezos.token.type]![tokenPair.tezos.token.address] = {};

          rootMap[tokenPair.tezos.token.type]![tokenPair.tezos.token.address]![tokenPair.tezos.token.tokenId] = tokenPair;
        }
      }

      // Etherlink
      if (tokenPair.etherlink.token.type !== 'native') {
        if (!rootMap[tokenPair.etherlink.token.type])
          rootMap[tokenPair.etherlink.token.type] = {};

        if (tokenPair.etherlink.token.type === 'erc20') {
          rootMap[tokenPair.etherlink.token.type]![tokenPair.etherlink.token.address] = tokenPair;
        }
      }
    }

    return rootMap;
  }
}
