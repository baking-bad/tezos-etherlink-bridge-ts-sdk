import BigNumber from 'bignumber.js';

export const convertTokensAmountToBigInt = (tokensAmount: BigNumber | number, decimals: number): bigint => {
  return BigInt(new BigNumber(tokensAmount).multipliedBy(10 ** decimals).integerValue().toString(10));
};

export const convertBigIntToTokensAmount = (value: bigint, decimals: number): BigNumber => {
  return new BigNumber(value.toString(10)).div(10 ** decimals);
};
