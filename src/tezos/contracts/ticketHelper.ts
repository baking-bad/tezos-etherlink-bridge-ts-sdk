import type { ContractAbstraction, ContractMethod, ContractProvider, Wallet } from '@taquito/taquito';

export type TicketHelperContract<T extends ContractProvider | Wallet = ContractProvider> = ContractAbstraction<T> & {
  methodsObject: {
    deposit(params: {
      rollup: string;
      routing_info: string;
      amount: bigint
    }): ContractMethod<T>;
  }
};
