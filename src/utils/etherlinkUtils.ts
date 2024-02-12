import { utils } from 'web3';
import * as web3Validator from 'web3-validator';

export const isAddress = (address: string): boolean => web3Validator.isAddress(address, true);

const isTransactionRegex = /^0x[0-9a-f]{64}$/;
export const isTransaction = (transactionHash: string) => isTransactionRegex.test(transactionHash);

export const toChecksumAddress = (address: string): string => utils.toChecksumAddress(address);

export const prepareHexPrefix = (value: string, addOrRemove: boolean): string => {
  return value.startsWith('0x')
    ? addOrRemove
      ? value
      : value.substring(2)
    : addOrRemove
      ? '0x' + value
      : value;
};
