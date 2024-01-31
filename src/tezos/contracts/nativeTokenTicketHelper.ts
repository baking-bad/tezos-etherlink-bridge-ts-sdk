import type { ContractAbstraction, ContractMethod, ContractProvider, Wallet } from '@taquito/taquito';

export type NativeTokenTicketHelper<T extends ContractProvider | Wallet = ContractProvider> = ContractAbstraction<T> & {
  methodsObject: {
    deposit(params: {
      evm_address: string;
      l2_address: string;
    }): ContractMethod<T>;
  }
};
