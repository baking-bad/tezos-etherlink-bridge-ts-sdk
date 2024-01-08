import type { ContractProvider, Wallet, ContractAbstraction, ContractMethod } from '@taquito/taquito';

export type FA12Contract<T extends ContractProvider | Wallet = ContractProvider> = ContractAbstraction<T> & {
  methods: {
    approve(address: string, amount: bigint): ContractMethod<T>;
  }
};
