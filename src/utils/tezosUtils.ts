import type { BatchOperation, TransactionOperation } from '@taquito/taquito';
import { encodePubKey, b58decode } from '@taquito/utils';

import { memoize } from './memoize';
import type { TezosToken, FA2Token } from '../tezos';


export const isFA2Token = (token: TezosToken): token is FA2Token => !!(token as FA2Token).tokenId;

export const convertAddressToBytes = (address: string, addPrefix = false): string => {
  const bytes = b58decode(address);

  return addPrefix ? '0x' + bytes : bytes;
};

export const convertBytesToAddress = (bytes: string): string => {
  if (bytes.startsWith('0x'))
    bytes = bytes.substring(2);

  return encodePubKey(bytes);
};

export const getOperationTotalCost = memoize((operation: TransactionOperation | BatchOperation) => {
  return operation.fee + Number.parseInt(operation.storageDiff) * 250;
});
