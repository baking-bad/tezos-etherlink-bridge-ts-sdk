import { TezosToolkit } from '@taquito/taquito';
import BigNumber from 'bignumber.js';

import { deposit } from '../tezos';

export const testFa2Deposit = async (toolkit: TezosToolkit, rollupAddress: string) => {
  const ticketHelperContractAddress = 'KT1F43xLyGYmE99q1PfGiMrCiEGT1ssqw2sT';
  const l1TokenContractAddress = 'KT1G37pgpbSHyz51yNHWC4XBJqYcuND7jWDo';
  const l1TokenId = BigNumber(0);

  const l2ReceiverAddress = '0xE6E1DeB1912FF45924ef5A93CB8ec41178037Bd0';
  const l2TokenProxyContractAddress = '0x7234dB1E040eD8d9752ef34a843909Bc05a691a1';

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
