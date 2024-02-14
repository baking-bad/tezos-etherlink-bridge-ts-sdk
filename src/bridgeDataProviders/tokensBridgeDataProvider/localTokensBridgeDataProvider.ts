import type { TokensBridgeDataProvider } from './tokensBridgeDataProvider';
import type { TokenPair } from '../../bridgeCore';
import type { EtherlinkToken } from '../../etherlink';
import type { TezosToken } from '../../tezos';

type TokenPairsByTokenMap = {
  native?: TokenPair,
  'fa1.2'?: {
    [address: string]: TokenPair;
  }
  erc20?: {
    [address: string]: TokenPair;
  }
  fa2?: {
    [address: string]: {
      [tokenId: string]: TokenPair;
    }
  }
};

type ReadonlyTokenPairsByTokenMap = {
  readonly native?: TokenPair,
  readonly 'fa1.2'?: {
    readonly [address: string]: TokenPair;
  }
  readonly erc20?: {
    readonly [address: string]: TokenPair;
  }
  readonly fa2?: {
    readonly [address: string]: {
      readonly [tokenId: string]: TokenPair;
    }
  }
};


export class LocalTokensBridgeDataProvider implements TokensBridgeDataProvider {
  private readonly tokenPairsByTokenMap: ReadonlyTokenPairsByTokenMap;

  constructor(readonly tokenPairs: readonly TokenPair[]) {
    this.tokenPairsByTokenMap = this.createTokenPairsByTokenMap(tokenPairs);
  }

  getRegisteredTokenPair(token: TezosToken | EtherlinkToken): Promise<TokenPair | null> {
    const tokenPair = token.type === 'native'
      ? this.tokenPairsByTokenMap[token.type]
      : token.type === 'fa1.2' || token.type === 'erc20'
        ? this.tokenPairsByTokenMap[token.type]?.[token.address]
        : token.type === 'fa2'
          ? this.tokenPairsByTokenMap[token.type]?.[token.address]?.[token.tokenId]
          : null;

    return Promise.resolve(tokenPair || null);
  }

  getRegisteredTokenPairs(): Promise<TokenPair[]>;
  getRegisteredTokenPairs(offset: number, limit: number): Promise<TokenPair[]>;
  getRegisteredTokenPairs(offset?: number, limit?: number): Promise<TokenPair[]>;
  getRegisteredTokenPairs(offset?: number, limit?: number): Promise<TokenPair[]> {
    return Promise.resolve(this.tokenPairs.slice(offset, limit && (limit + (offset || 0))));
  }

  private createTokenPairsByTokenMap(tokenPairs: readonly TokenPair[]): TokenPairsByTokenMap {
    const rootMap: TokenPairsByTokenMap = {};

    for (const tokenPair of tokenPairs) {
      // Tezos Part
      if (tokenPair.tezos.type === 'native') {
        rootMap.native = tokenPair;
      }
      else {
        if (!rootMap[tokenPair.tezos.type])
          rootMap[tokenPair.tezos.type] = {};

        if (tokenPair.tezos.type === 'fa1.2') {
          rootMap[tokenPair.tezos.type]![tokenPair.tezos.address] = tokenPair;
        }
        else {
          if (!rootMap[tokenPair.tezos.type]![tokenPair.tezos.address])
            rootMap[tokenPair.tezos.type]![tokenPair.tezos.address] = {};

          rootMap[tokenPair.tezos.type]![tokenPair.tezos.address]![tokenPair.tezos.tokenId] = tokenPair;
        }
      }

      // Etherlink
      if (tokenPair.etherlink.type !== 'native') {
        if (!rootMap[tokenPair.etherlink.type])
          rootMap[tokenPair.etherlink.type] = {};

        if (tokenPair.etherlink.type === 'erc20') {
          rootMap[tokenPair.etherlink.type]![tokenPair.etherlink.address] = tokenPair;
        }
      }
    }

    return rootMap;
  }
}
