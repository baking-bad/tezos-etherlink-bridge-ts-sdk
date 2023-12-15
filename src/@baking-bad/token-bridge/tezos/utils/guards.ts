import { FA12Token, FA2Token } from '../../blockchain/tezos';

export const isFa12Token = (token: FA12Token | FA2Token): token is FA12Token => {
  return Object.hasOwn(token, 'tokenId');
};
