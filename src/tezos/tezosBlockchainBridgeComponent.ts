import type { ContractProvider, OperationBatch, ParamsWithKind, Wallet, WalletOperationBatch, WalletParamsWithKind } from '@taquito/taquito';

import { TicketHelperContract, FA12Contract, FA2Contract } from './contracts';
import { TezosBlockchainBridgeComponentBase } from './tezosBlockchainBridgeComponentBase';
import type { TezosBlockchainBridgeComponentOptions } from './tezosBlockchainBridgeComponentOptions';

export class TezosBlockchainBridgeComponent extends TezosBlockchainBridgeComponentBase<ContractProvider> {
  readonly wallet: WalletTezosBlockchainBridgeComponent;

  constructor(options: TezosBlockchainBridgeComponentOptions) {
    super(options);

    this.wallet = new WalletTezosBlockchainBridgeComponent(options);
  }

  protected createBatch(params?: ParamsWithKind[]): OperationBatch {
    return this.tezosToolkit.contract.batch(params);
  }

  protected getTicketHelperContract(ticketHelperContractAddress: string): Promise<TicketHelperContract<ContractProvider>> {
    return this.tezosToolkit.contract.at<TicketHelperContract<ContractProvider>>(ticketHelperContractAddress);
  }

  protected getFA12TokenContract(fa12TokenContractAddress: string): Promise<FA12Contract<ContractProvider>> {
    return this.tezosToolkit.contract.at<FA12Contract<ContractProvider>>(fa12TokenContractAddress);
  }

  protected getFA2TokenContract(fa2TokenContractAddress: string): Promise<FA2Contract<ContractProvider>> {
    return this.tezosToolkit.contract.at<FA2Contract<ContractProvider>>(fa2TokenContractAddress);
  }
}

export class WalletTezosBlockchainBridgeComponent extends TezosBlockchainBridgeComponentBase<Wallet> {
  protected createBatch(params?: WalletParamsWithKind[] | undefined): WalletOperationBatch {
    return this.tezosToolkit.wallet.batch(params);
  }

  protected getTicketHelperContract(ticketHelperContractAddress: string): Promise<TicketHelperContract<Wallet>> {
    return this.tezosToolkit.wallet.at<TicketHelperContract<Wallet>>(ticketHelperContractAddress);
  }

  protected getFA12TokenContract(fa12TokenContractAddress: string): Promise<FA12Contract<Wallet>> {
    return this.tezosToolkit.wallet.at<FA12Contract<Wallet>>(fa12TokenContractAddress);
  }

  protected getFA2TokenContract(fa2TokenContractAddress: string): Promise<FA2Contract<Wallet>> {
    return this.tezosToolkit.wallet.at<FA2Contract<Wallet>>(fa2TokenContractAddress);
  }
}
