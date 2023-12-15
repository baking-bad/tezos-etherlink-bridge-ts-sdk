import { ContractAbstraction, ContractMethod, ContractProvider, Wallet } from '@taquito/taquito';
import BigNumber from 'bignumber.js';

export interface FA12TokenObject {
  fa12: string
}

export interface FA2TokenObject {
  fa2: {
    contract_address: string;
    token_id: BigNumber
  }
}

export type TokenObject = FA12TokenObject | FA2TokenObject;

export type TicketerContract<T extends ContractProvider | Wallet = ContractProvider> = ContractAbstraction<T> & {
  methodsObject: {
    deposit(params: {
      token: TokenObject,
      amount: BigNumber
    }): ContractMethod<T>;
  }
};
