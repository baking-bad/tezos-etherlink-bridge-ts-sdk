import { TezosToolkit } from '@taquito/taquito';
import BigNumber from 'bignumber.js';
import Web3 from 'web3';

import { withdraw } from '../evm/l2Protocol';
import { convertTicketerContentToBytes } from '../evm/utils';

export const withdrawFa2 = async (web3Toolkit: Web3, tezosToolkit: TezosToolkit) => {
  const kernelAddress = '0x0000000000000000000000000000000000000040';
  const ticketOwnerAddress = '0x7234dB1E040eD8d9752ef34a843909Bc05a691a1'; //erc20 proxy
  const l1ReceiverAddress = 'tz1aWJnH8SjA1zniwqNuFJkL7Qpc8o7DN2wu';
  const l1TicketerAddress = 'KT1P5SYWnV4ZH6V6hnHaVKuMnicwDqQdmxdP';
  const l1RouterAddress = l1TicketerAddress;

  // eslint-disable-next-line max-len
  // const l1TicketContent = '0x0707000005090a000000aa0502000000a407040100000010636f6e74726163745f616464726573730a0000001c050a000000160151c49afc78437c4db86e7358430b22d13b4906a20007040100000008646563696d616c730a000000030500000704010000000673796d626f6c0a0000000d0501000000074641322d54535407040100000008746f6b656e5f69640a000000030500000704010000000a746f6b656e5f747970650a00000009050100000003464132';
  const l1TicketContent = `0x${await convertTicketerContentToBytes(tezosToolkit, l1TicketerAddress)}`;

  const senderAddress = web3Toolkit.eth.defaultAccount;
  if (!senderAddress)
    throw new Error('web3 default account is not set');

  const amount = BigNumber(17);

  const result = await withdraw(
    web3Toolkit,
    kernelAddress,
    ticketOwnerAddress,
    l1ReceiverAddress,
    amount,
    l1TicketerAddress,
    l1RouterAddress,
    l1TicketContent,
    senderAddress
  );

  console.log('Fa2 Withdraw L2 Operation Hash:', result.transactionHash);
};
