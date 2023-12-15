import { TezosToolkit, Wallet } from '@taquito/taquito';
import { BatchWalletOperation } from '@taquito/taquito/dist/types/wallet/batch-operation';
import BigNumber from 'bignumber.js';

import { TicketerContract } from './contracts';
import { FA12Token } from '../../blockchain/tezos';
import { FA12Contract } from '../contracts';
import { fa12helper } from '../utils';

export class Fa12Protocol {
  async deposit(
    toolkit: TezosToolkit,
    ticketerContractAddress: string,
    token: FA12Token,
    amount: BigNumber
  ): Promise<BatchWalletOperation> {
    const [ticketerContract, tokenContract] = await Promise.all([
      toolkit.wallet.at<TicketerContract<Wallet>>(ticketerContractAddress),
      toolkit.wallet.at<FA12Contract<Wallet>>(token.address)
    ]);

    const operation = await fa12helper.wrapContractCallsWithApprove({
      toolkit,
      tokenContract,
      approvedAmount: amount,
      approvedAddress: ticketerContract.address,
      contractCalls: [
        ticketerContract.methodsObject.deposit({
          token: { fa12: token.address },
          amount
        })
      ]
    }).send();

    return operation;
  }

  withdraw(): Promise<void> {
    throw new Error('Not implemented');
  }
}
