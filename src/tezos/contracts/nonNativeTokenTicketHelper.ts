import type { ContractAbstraction, ContractMethod, ContractProvider, Wallet } from '@taquito/taquito';

export type NonNativeTokenTicketHelper<T extends ContractProvider | Wallet = ContractProvider> = ContractAbstraction<T> & {
  methodsObject: {
    deposit(params: {
      rollup: string;
      receiver: string;
      amount: bigint
    }): ContractMethod<T>;
  }
};
