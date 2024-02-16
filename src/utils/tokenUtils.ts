import { isReadonlyArray } from './guards';
import type { Token } from '../common';
import type { EtherlinkToken } from '../etherlink';
import type { TezosToken } from '../tezos';

export const isTezosToken = (token: Token): token is TezosToken => {
  return token.type === 'native' || token.type === 'fa1.2' || token.type === 'fa2';
};

const convertTokenToDisplayString = (token: TezosToken | EtherlinkToken): string => {
  if (!token)
    return `[token is ${token === null ? 'null' : 'undefined'}]`;

  switch (token.type) {
    case 'native':
      return '[native token]';
    case 'erc20':
      return `[${token.address} | ERC-20]`;
    case 'fa1.2':
      return `[${token.address} | FA1.2]`;
    case 'fa2':
      return `[${token.address} | FA2 | Id: ${token.tokenId}]`;
    default:
      return '[unknown token type]';
  }
};

const convertTokensToDisplayString = (tokens: ReadonlyArray<TezosToken | EtherlinkToken>): string => {
  return tokens.reduce(
    (result, token, index, tokens) => result + convertTokenToDisplayString(token) + (index < tokens.length - 1 ? ', ' : ']'),
    '['
  );
};

export const toDisplayString = (tokenOrTokens: TezosToken | EtherlinkToken | ReadonlyArray<TezosToken | EtherlinkToken>): string => {
  return isReadonlyArray(tokenOrTokens)
    ? convertTokensToDisplayString(tokenOrTokens)
    : convertTokenToDisplayString(tokenOrTokens);
};
