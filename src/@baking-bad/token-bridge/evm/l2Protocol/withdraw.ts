import BigNumber from 'bignumber.js';
import Web3, { TransactionReceipt } from 'web3';

import { kernelAbi } from './contracts';

export const withdraw = async (
  toolkit: Web3,
  kernelAddress: string,        // precompile 0x40
  ticketOwnerAddress: string,   // erc20proxy address
  l1ReceiverAddress: string,
  amount: BigNumber,
  l1TicketerAddress: string,
  l1TicketContent: string,

  senderAddress: string
): Promise<TransactionReceipt> => {
  const kernel = new toolkit.eth.Contract(
    kernelAbi,
    kernelAddress
  );

  //TODO: encode parameters
  const data: string = kernel.methods
    .withdraw(
      ticketOwnerAddress,
      l1ReceiverAddress,
      toolkit.utils.toBigInt(amount),
      l1TicketerAddress,
      l1TicketContent
    )
    .encodeABI();

  const gas = undefined; // TODO: calculate correct gas limit or skip

  const receipt: TransactionReceipt = await toolkit.eth.sendTransaction({
    from: senderAddress,
    to: kernelAddress,
    gas,
    data,
  });

  return receipt;
};
