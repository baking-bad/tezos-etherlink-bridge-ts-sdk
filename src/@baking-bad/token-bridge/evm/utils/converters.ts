import { packDataBytes } from '@taquito/michel-codec';
import BigNumber from 'bignumber.js';

export const convertTezosAddressToBytes = (address: string): string => {
  return packDataBytes({ string: address }, { prim: 'address' }).bytes.slice(-44);
};

export const convertBigNumberToBigInt = (number: BigNumber): bigint => {
  const strValue = number.toString(10);
  return (strValue.startsWith('-'))
    ? -BigInt(strValue.substring(1))
    : BigInt(strValue);
};
