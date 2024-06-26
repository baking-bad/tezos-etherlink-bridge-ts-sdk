import type { ContractAbstraction, ContractMethod, ContractProvider, Wallet } from '@taquito/taquito';

export interface FA2UpdateOperatorParameters {
  owner: string;
  operator: string;
  token_id: string;
}

export interface FA2AddOperatorParameters {
  add_operator: FA2UpdateOperatorParameters;
}

export interface FA2RemoveOperatorParameters {
  remove_operator: FA2UpdateOperatorParameters;
}

export type FA2UpdateOperatorsPayload = Array<FA2AddOperatorParameters | FA2RemoveOperatorParameters>;

export type FA2Contract<T extends ContractProvider | Wallet = ContractProvider> = ContractAbstraction<T> & {
  methods: {
    update_operators(payload: FA2UpdateOperatorsPayload): ContractMethod<T>;
  }
};
