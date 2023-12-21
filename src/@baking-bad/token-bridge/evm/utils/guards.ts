import { isAddress } from 'web3-validator';

export const checkEvmAddressIsCorrect = (address: string) => {
  if (!isAddress(address))
    throw new Error(`evm address '${address}' is not correct`);
};
