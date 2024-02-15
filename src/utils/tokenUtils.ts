import { EtherlinkToken } from '../etherlink';
import { TezosToken } from '../tezos';

export const toDisplayString = (token: TezosToken | EtherlinkToken): string => {
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
