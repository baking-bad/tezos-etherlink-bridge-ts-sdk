import BigNumber from 'bignumber.js';
import Web3, { TransactionReceipt } from 'web3';

import { kernelAbi } from './contracts';
import { convertBigNumberToBigInt, convertTezosAddressToBytes } from '../utils';

export const withdraw = async (
  toolkit: Web3,
  kernelAddress: string,        // precompile 0x40 | 0x0000000000000000000000000000000000000040
  ticketOwnerAddress: string,   // erc20proxy address in our case
  l1ReceiverAddress: string,
  amount: BigNumber,
  l1TicketerAddress: string,
  l1RouterAddress: string,      // in our case router is ticketer address
  l1TicketContent: string,

  senderAddress: string         // TODO: Should we get it from toolkit.eth.defaultAccount ?
): Promise<TransactionReceipt> => {
  const kernel = new toolkit.eth.Contract(
    kernelAbi,
    kernelAddress
  );

  const receiverBytes = `0x${convertTezosAddressToBytes(l1ReceiverAddress)}${convertTezosAddressToBytes(l1RouterAddress)}`;
  const ticketerAddressBytes = `0x${convertTezosAddressToBytes(l1TicketerAddress)}`;
  const amountBigInt = convertBigNumberToBigInt(amount);

  const data: string = kernel.methods
    .withdraw(
      ticketOwnerAddress,
      receiverBytes,
      amountBigInt,
      ticketerAddressBytes,
      l1TicketContent
    )
    .encodeABI();


  const gasPrice = await toolkit.eth.getGasPrice();

  const receipt: TransactionReceipt = await toolkit.eth.sendTransaction({
    from: senderAddress,
    to: kernelAddress,
    gas: BigInt('30000'), // TODO: need to calculate the value or hardcode it in config 
    gasPrice,             // without gasPrice we get the 'Network doesn't support eip-1559' exception
    data,
  });

  return receipt;
};
