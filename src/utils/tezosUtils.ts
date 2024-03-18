import { b58decode, encodeAddress } from '@taquito/utils';

export const convertAddressToBytes = (address: string, addPrefix = false): string => {
  const bytes = b58decode(address);

  return addPrefix ? '0x' + bytes : bytes;
};

export const convertBytesToAddress = (bytes: string): string => {
  if (bytes.startsWith('0x'))
    bytes = bytes.substring(2);

  return encodeAddress(bytes);
};
