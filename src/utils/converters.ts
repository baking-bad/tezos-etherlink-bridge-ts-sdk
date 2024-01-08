import { encodePubKey, b58decode } from '@taquito/utils';
import BigNumber from 'bignumber.js';

export const convertTezosAddressToBytes = (address: string, addPrefix = false): string => {
  const bytes = b58decode(address);

  return addPrefix ? '0x' + bytes : bytes;
};

export const convertBytesToTezosAddress = (bytes: string): string => {
  if (bytes.startsWith('0x'))
    bytes = bytes.substring(2);

  return encodePubKey(bytes);
};

export const convertTokensAmountToBigInt = (tokensAmount: BigNumber | number, decimals: number): bigint => {
  return BigInt(new BigNumber(tokensAmount).multipliedBy(10 ** decimals).integerValue().toString(10));
};

export const convertBigIntToTokensAmount = (value: bigint, decimals: number): BigNumber => {
  return new BigNumber(value.toString(10)).div(10 ** decimals);
};
