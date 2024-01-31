import { LocalForger } from '@taquito/local-forging';
import { type TezosToolkit, type Wallet, type ContractProvider } from '@taquito/taquito';

import type { FA12Contract, FA2Contract, TicketHelperContract } from './contracts';
import { fa12helper, fa2helper } from './helpers';
import type { TezosBlockchainBridgeComponentOptions } from './tezosBlockchainBridgeComponentOptions';
import type { FA12TezosToken, FA2TezosToken, NonNativeTezosToken } from './tokens';
import { tezosUtils } from '../utils';

export interface DepositParams {
  token: NonNativeTezosToken;
  amount: bigint;
  etherlinkReceiverAddress: string;
  etherlinkTokenProxyContractAddress: string;
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

  async deposit(params: DepositParams): Promise<ReturnType<ReturnType<TApi['batch']>['send']>> {
    const depositOperation = await this.createDepositOperation(
      params.etherlinkReceiverAddress,
      params.amount,
      params.etherlinkTokenProxyContractAddress,
      params.ticketHelperContractAddress
    );

    let batch = this.createBatch();
    batch = await (tezosUtils.isFA2Token(params.token)
      ? this.wrapContractCallsWithFA2TokenApprove(batch, depositOperation, params.token, params.ticketHelperContractAddress)
      : this.wrapContractCallsWithFA12TokenApprove(batch, depositOperation, params.token, params.amount, params.ticketHelperContractAddress));

    return batch.send() as ReturnType<ReturnType<TApi['batch']>['send']>;
  }

  async finishWithdraw(commitment: string, proof: string): ReturnType<ContractProvider['smartRollupExecuteOutboxMessage']> {
    const executeOutboxMessageOperation = await this.tezosToolkit.contract.smartRollupExecuteOutboxMessage({
      rollup: this.rollupAddress,
      cementedCommitment: commitment,
      outputProof: proof
    });

    return executeOutboxMessageOperation;
  }

  protected async createDepositOperation(
    etherlinkReceiverAddress: string,
    amount: bigint,
    etherlinkTokenProxyContractAddress: string,
    ticketHelperContractAddress: string
  ) {
    const ticketHelperContract = await this.getTicketHelperContract(ticketHelperContractAddress);
    const routingInfo = this.packDepositRoutingInfo(etherlinkReceiverAddress, etherlinkTokenProxyContractAddress);

    const operation = ticketHelperContract.methodsObject.deposit({
      rollup: this.rollupAddress,
      routing_info: routingInfo,
      amount
    });

    return operation;
  }

  protected packDepositRoutingInfo(etherlinkReceiverAddress: string, etherlinkTokenProxyContractAddress: string): string {
    // TODO: validate
    // checkEvmAddressIsCorrect(etherlinkReceiverAddress);
    // checkEvmAddressIsCorrect(etherlinkTokenProxyContractAddress);

    return `${etherlinkReceiverAddress.substring(2)}${etherlinkTokenProxyContractAddress.substring(2)}`;
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
  protected abstract getTicketHelperContract(ticketHelperContractAddress: string): Promise<TicketHelperContract<TApi>>;
  protected abstract getFA12TokenContract(fa12TokenContractAddress: string): Promise<FA12Contract<TApi>>;
  protected abstract getFA2TokenContract(fa2TokenContractAddress: string): Promise<FA2Contract<TApi>>;
}
