import { TezosToolkit } from '@taquito/taquito';
import BigNumber from 'bignumber.js';
import * as dotenv from 'dotenv';

import { createTezosToolkitWithSigner } from './createTezosToolkitWithSigner';
import { deposit } from '../tezos';

const testFa12Deposit = async (toolkit: TezosToolkit, rollupAddress: string) => {
  const ticketHelperContractAddress = 'KT1Tqrhai3by5KzUws5KxtjrVtGcm3RsACoS';
  const l1TokenContractAddress = 'KT1X1m5jGHfadzSDWg1tMDo54gH34fjZZosb';
  const l1TokenId = undefined;

  const l2ReceiverAddress = '0xbFc6dc08Bd0e8FBa3a25D7A70728E76E627c9A90';
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

const testFa2Deposit = async (toolkit: TezosToolkit, rollupAddress: string) => {
  const ticketHelperContractAddress = 'KT1F43xLyGYmE99q1PfGiMrCiEGT1ssqw2sT';
  const l1TokenContractAddress = 'KT1G37pgpbSHyz51yNHWC4XBJqYcuND7jWDo';
  const l1TokenId = BigNumber(0);

  const l2ReceiverAddress = '0xbFc6dc08Bd0e8FBa3a25D7A70728E76E627c9A90';
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

(async () => {
  dotenv.config();

  const rpcUrl = 'https://rpc.tzkt.io/nairobinet';
  const rollupAddress = 'sr1FLVPpwyYeQptyaUpmbkevMWTdU3PL6XFF';
  const executorKey = process.env.TOKEN_OWNER_PRIVATE_KEY as string;
  const toolkit = createTezosToolkitWithSigner(executorKey, rpcUrl);

  await testFa12Deposit(toolkit, rollupAddress);
  await testFa2Deposit(toolkit, rollupAddress);
})();
