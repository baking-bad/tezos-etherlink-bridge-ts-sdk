import BigNumber from 'bignumber.js';
import Web3 from 'web3';

import { withdraw } from '../evm/l2Protocol';

export const withdrawFa12 = async (toolkit: Web3) => {
  const kernelAddress = '0x0000000000000000000000000000000000000040';
  const ticketOwnerAddress = '0x6065534feE55f585C2d43f8e78BcE4C308EE066B'; //erc20 proxy
  const l1ReceiverAddress = 'tz1aWJnH8SjA1zniwqNuFJkL7Qpc8o7DN2wu';
  const l1TicketerAddress = 'KT1NWgvuovoS1vSYWYnrRa4y84x5qwMPRnLf';
  const l1RouterAddress = l1TicketerAddress;

  // TODO: We need to get this data from ticketerContract.storage.content
  // now we can use convertTicketerContentToBytes method
  // eslint-disable-next-line max-len
  const l1TicketContent = '0x0707000005090a0000009705020000009107040100000010636f6e74726163745f616464726573730a0000001c050a0000001601f60cc345d78a0e897696f70bce9466652c30b95b0007040100000008646563696d616c730a000000030500000704010000000673796d626f6c0a0000000f0501000000094641312e322d5453540704010000000a746f6b656e5f747970650a0000000b0501000000054641312e32';

  const senderAddress = toolkit.eth.defaultAccount;
  if (!senderAddress)
    throw new Error('web3 default account is not set');

  const amount = BigNumber(17);

  const result = await withdraw(
    toolkit,
    kernelAddress, 
    ticketOwnerAddress,
    l1ReceiverAddress,
    amount,
    l1TicketerAddress,
    l1RouterAddress,
    l1TicketContent,
    senderAddress
  );

  console.log('transactionHash', result.transactionHash);
};
