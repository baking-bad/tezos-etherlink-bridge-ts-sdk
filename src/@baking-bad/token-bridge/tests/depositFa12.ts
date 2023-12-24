import { TezosToolkit } from '@taquito/taquito';
import BigNumber from 'bignumber.js';

import { deposit } from '../tezos';

export const testFa12Deposit = async (toolkit: TezosToolkit, rollupAddress: string) => {
  const ticketHelperContractAddress = 'KT1Tqrhai3by5KzUws5KxtjrVtGcm3RsACoS';
  const l1TokenContractAddress = 'KT1X1m5jGHfadzSDWg1tMDo54gH34fjZZosb';
  const l1TokenId = undefined;

  const l2ReceiverAddress = '0xE6E1DeB1912FF45924ef5A93CB8ec41178037Bd0';
  const l2TokenProxyContractAddress = '0x6065534feE55f585C2d43f8e78BcE4C308EE066B';

  const amount = BigNumber(100);

  const result = await deposit(
    toolkit,
    rollupAddress,
    ticketHelperContractAddress,
    l1TokenContractAddress,
    l1TokenId,
    l2ReceiverAddress,
    l2TokenProxyContractAddress,
    amount
  );

  await result.confirmation(1);

  console.log(result.opHash);
};
