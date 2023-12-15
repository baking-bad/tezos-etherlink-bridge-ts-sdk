import { TezosToolkit, Wallet } from '@taquito/taquito';
import { BatchWalletOperation } from '@taquito/taquito/dist/types/wallet/batch-operation';
import BigNumber from 'bignumber.js';

import { TicketerContract } from './contracts';
import { FA2Token } from '../../blockchain/tezos';
import { FA2Contract } from '../contracts';
import { fa2helper } from '../utils';

export class Fa12Protocol {
  async deposit(
    toolkit: TezosToolkit,
    ticketerContractAddress: string,
    token: FA2Token,
    amount: BigNumber
  ): Promise<BatchWalletOperation> {
    const [ticketerContract, tokenContract] = await Promise.all([
      toolkit.wallet.at<TicketerContract<Wallet>>(ticketerContractAddress),
      toolkit.wallet.at<FA2Contract<Wallet>>(token.address)
    ]);

    const tokenId = BigNumber(token.tokenId);
    const ownerAddress = await toolkit.wallet.pkh();

    const operation = await fa2helper.wrapContractCallsWithApprove({
      toolkit,
      tokenContract,
      tokenId,
      ownerAddress,
      approvedAddress: ticketerContract.address,
      contractCalls: [
        ticketerContract.methodsObject.deposit({
          token: {
            fa2: {
              contract_address: token.address,
              token_id: tokenId
            }
          },
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
