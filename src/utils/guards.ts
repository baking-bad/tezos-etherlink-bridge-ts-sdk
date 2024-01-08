import type { FA2Token, TezosToken } from '../tezos/tokens';

export const isFA2TezosToken = (token: TezosToken): token is FA2Token => !!(token as FA2Token).tokenId;
