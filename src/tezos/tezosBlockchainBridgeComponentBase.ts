import { LocalForger } from '@taquito/local-forging';
import { type TezosToolkit, type Wallet, type ContractProvider, type ContractMethod } from '@taquito/taquito';

import type { FA12Contract, FA2Contract, NativeTokenTicketHelper, NonNativeTokenTicketHelper } from './contracts';
import { fa12helper, fa2helper } from './helpers';
import type { TezosBlockchainBridgeComponentOptions } from './tezosBlockchainBridgeComponentOptions';
import type { FA12TezosToken, FA2TezosToken, NonNativeTezosToken } from './tokens';
import { tezosUtils } from '../utils';

export interface DepositNativeTokenParams {
  amount: bigint;
  etherlinkReceiverAddress: string;
  ticketHelperContractAddress: string;
}

export interface DepositNonNativeTokensParams {
  token: NonNativeTezosToken;
  amount: bigint;
  etherlinkReceiverAddress: string;
  ticketHelperContractAddress: string;
}

export abstract class TezosBlockchainBridgeComponentBase<TApi extends ContractProvider | Wallet> {
  protected readonly tezosToolkit: TezosToolkit;
  protected readonly rollupAddress: string;
  protected readonly localForger = new LocalForger();

  constructor(options: TezosBlockchainBridgeComponentOptions) {
    this.tezosToolkit = options.tezosToolkit;
    this.rollupAddress = options.rollupAddress;
  }

  async depositNativeToken(params: DepositNativeTokenParams): Promise<ReturnType<ReturnType<TApi['batch']>['send']>> {
    const depositOperation = await this.createDepositNativeTokenOperation(
      params.etherlinkReceiverAddress,
      params.ticketHelperContractAddress
    );

    const batch = this.createBatch()
      .withContractCall(depositOperation as ContractMethod<ContractProvider> & ContractMethod<Wallet>, { amount: Number(params.amount), mutez: true });

    return batch.send() as ReturnType<ReturnType<TApi['batch']>['send']>;
  }

  async depositNonNativeToken(params: DepositNonNativeTokensParams): Promise<ReturnType<ReturnType<TApi['batch']>['send']>> {
    const depositOperation = await this.createDepositNonNativeTokenOperation(
      params.etherlinkReceiverAddress,
      params.amount,
      params.ticketHelperContractAddress
    );

    let batch = this.createBatch();
    batch = await (params.token.type === 'fa2'
      ? this.wrapContractCallsWithFA2TokenApprove(batch, depositOperation, params.token, params.ticketHelperContractAddress)
      : this.wrapContractCallsWithFA12TokenApprove(batch, depositOperation, params.token, params.amount, params.ticketHelperContractAddress));

    return batch.send() as ReturnType<ReturnType<TApi['batch']>['send']>;
  }

  async finishWithdraw(commitment: string, proof: string) {
    return this.tezosToolkit.contract.smartRollupExecuteOutboxMessage({
      rollup: this.rollupAddress,
      cementedCommitment: commitment,
      outputProof: proof
    });
  }

  protected async createDepositNativeTokenOperation(etherlinkReceiverAddress: string, ticketerContractAddress: string) {
    const ticketHelperContract = await this.getNativeTokenTicketHelperContract(ticketerContractAddress);
    const routingInfo = this.packDepositRoutingInfo(etherlinkReceiverAddress);

    const operation = ticketHelperContract.methodsObject.deposit({
      evm_address: this.rollupAddress,
      l2_address: routingInfo,
    });

    return operation;
  }

  protected async createDepositNonNativeTokenOperation(
    etherlinkReceiverAddress: string,
    amount: bigint,
    ticketHelperContractAddress: string
  ) {
    const ticketHelperContract = await this.getNonNativeTokenTicketHelperContract(ticketHelperContractAddress);
    const routingInfo = this.packDepositRoutingInfo(etherlinkReceiverAddress);

    const operation = ticketHelperContract.methodsObject.deposit({
      rollup: this.rollupAddress,
      receiver: routingInfo,
      amount
    });

    return operation;
  }

  protected packDepositRoutingInfo(etherlinkReceiverAddress: string, etherlinkProxyAddress?: string): string {
    // TODO: validate
    // checkEvmAddressIsCorrect(etherlinkReceiverAddress);
    // checkEvmAddressIsCorrect(etherlinkTokenProxyContractAddress);
    return (etherlinkProxyAddress)
      ? `${etherlinkReceiverAddress.substring(2)}${etherlinkProxyAddress.substring(2)}`
      : etherlinkReceiverAddress.substring(2);
  }

  protected async wrapContractCallsWithFA12TokenApprove(
    batch: ReturnType<TApi['batch']>,
    contractCalls: Parameters<typeof fa12helper.wrapContractCallsWithApprove>[0]['contractCalls'],
    token: FA12TezosToken,
    amount: bigint,
    ticketHelperContractAddress: string
  ): Promise<ReturnType<TApi['batch']>> {
    const tokenContract = await this.getFA12TokenContract(token.address);
    const resultOperation = fa12helper.wrapContractCallsWithApprove({
      batch,
      approvedAddress: ticketHelperContractAddress,
      approvedAmount: amount,
      tokenContract,
      contractCalls
    });

    return resultOperation as ReturnType<TApi['batch']>;
  }

  protected async wrapContractCallsWithFA2TokenApprove(
    batch: ReturnType<TApi['batch']>,
    contractCalls: Parameters<typeof fa2helper.wrapContractCallsWithApprove>[0]['contractCalls'],
    token: FA2TezosToken,
    ticketHelperContractAddress: string
  ): Promise<ReturnType<TApi['batch']>> {
    const [tokenContract, tokenOwnerAddress] = await Promise.all([
      this.getFA2TokenContract(token.address),
      this.tezosToolkit.wallet.pkh()
    ]);

    const resultOperation = fa2helper.wrapContractCallsWithApprove({
      batch,
      approvedAddress: ticketHelperContractAddress,
      ownerAddress: tokenOwnerAddress,
      tokenId: token.tokenId,
      tokenContract,
      contractCalls
    });

    return resultOperation as ReturnType<TApi['batch']>;
  }

  protected abstract createBatch(params?: Parameters<TApi['batch']>[0]): ReturnType<TApi['batch']>;
  protected abstract getNativeTokenTicketHelperContract(ticketHelperContractAddress: string): Promise<NativeTokenTicketHelper<TApi>>;
  protected abstract getNonNativeTokenTicketHelperContract(ticketHelperContractAddress: string): Promise<NonNativeTokenTicketHelper<TApi>>;
  protected abstract getFA12TokenContract(fa12TokenContractAddress: string): Promise<FA12Contract<TApi>>;
  protected abstract getFA2TokenContract(fa2TokenContractAddress: string): Promise<FA2Contract<TApi>>;
}
