import { LocalForger } from '@taquito/local-forging';
import type { OperationContentsSmartRollupExecuteOutboxMessage } from '@taquito/rpc';
import { OpKind, type BatchOperation, type TezosToolkit } from '@taquito/taquito';

import type { FA12Contract, FA2Contract, TicketHelperContract } from './contracts';
import { fa12helper, fa2helper } from './helpers';
import type { FA12Token, FA2Token, TezosToken } from './tokens';
import { tezosUtils } from '../utils';

interface DepositParams {
  token: TezosToken;
  amount: bigint;
  etherlinkReceiverAddress: string;
  etherlinkTokenProxyContractAddress: string;
  ticketHelperContractAddress: string;
}

export interface TezosBlockchainBridgeComponentOptions {
  tezosToolkit: TezosToolkit;
  rollupAddress: string;
}

export class TezosBlockchainBridgeComponent {
  protected readonly tezosToolkit: TezosToolkit;
  protected readonly rollupAddress: string;
  protected readonly localForger = new LocalForger();

  constructor(options: TezosBlockchainBridgeComponentOptions) {
    this.tezosToolkit = options.tezosToolkit;
    this.rollupAddress = options.rollupAddress;
  }

  async deposit(params: DepositParams): Promise<BatchOperation> {
    const depositOperation = await this.createDepositOperation(
      params.etherlinkReceiverAddress,
      params.amount,
      params.etherlinkTokenProxyContractAddress,
      params.ticketHelperContractAddress
    );

    const batchWalletOperation = await (tezosUtils.isFA2Token(params.token)
      ? this.wrapContractCallsWithFA2TokenApprove(depositOperation, params.token, params.ticketHelperContractAddress)
      : this.wrapContractCallsWithFA12TokenApprove(depositOperation, params.token, params.amount, params.ticketHelperContractAddress));

    return batchWalletOperation;
  }

  async finishWithdraw(commitment: string, proof: string): Promise<string> {
    const sourceAddress = await this.tezosToolkit.wallet.pkh();
    const chainId = await this.tezosToolkit.rpc.getChainId();
    const branch = await this.tezosToolkit.rpc.getBlockHash();
    const accountRpcData = await this.tezosToolkit.rpc.getContract(sourceAddress);

    const executeOutboxMessageRawOperation: OperationContentsSmartRollupExecuteOutboxMessage = {
      kind: OpKind.SMART_ROLLUP_EXECUTE_OUTBOX_MESSAGE,
      source: sourceAddress,
      fee: '3000',
      counter: (parseInt(accountRpcData.counter || '0') + 1).toString(),
      gas_limit: '10000',
      storage_limit: '10',
      rollup: this.rollupAddress,
      cemented_commitment: commitment,
      output_proof: proof,
    };

    const operationPreRun = await this.tezosToolkit.rpc.runOperation({
      chain_id: chainId,
      operation: {
        branch,
        contents: [executeOutboxMessageRawOperation]
      }
    });

    if (operationPreRun.contents.some((content: any) => content.metadata?.operation_result?.status === 'failed'))
      throw new Error('No possible to execute an outbox message');

    const forgedBytes = await this.localForger.forge({
      branch,
      contents: [executeOutboxMessageRawOperation]
    });

    const signed = await this.tezosToolkit.signer.sign(forgedBytes, new Uint8Array([3]));
    const operationHash = await this.tezosToolkit.rpc.injectOperation(signed.sbytes);

    return operationHash;
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

  protected async getTicketHelperContract(ticketHelperContractAddress: string): Promise<TicketHelperContract> {
    // TODO: do we need to cache the ticket helper contract?
    return this.tezosToolkit.contract.at<TicketHelperContract>(ticketHelperContractAddress);
  }

  protected packDepositRoutingInfo(etherlinkReceiverAddress: string, etherlinkTokenProxyContractAddress: string): string {
    // TODO: validate
    // checkEvmAddressIsCorrect(etherlinkReceiverAddress);
    // checkEvmAddressIsCorrect(etherlinkTokenProxyContractAddress);

    return `${etherlinkReceiverAddress.substring(2)}${etherlinkTokenProxyContractAddress.substring(2)}`;
  }

  private async wrapContractCallsWithFA12TokenApprove(
    contractCalls: Parameters<typeof fa12helper.wrapContractCallsWithApprove>[0]['contractCalls'],
    token: FA12Token,
    amount: bigint,
    ticketHelperContractAddress: string
  ): Promise<BatchOperation> {
    const tokenContract = await this.tezosToolkit.contract.at<FA12Contract>(token.address);
    const resultOperation = fa12helper.wrapContractCallsWithApprove({
      toolkit: this.tezosToolkit,
      approvedAddress: ticketHelperContractAddress,
      approvedAmount: amount,
      tokenContract,
      contractCalls
    });

    return resultOperation.send();
  }

  private async wrapContractCallsWithFA2TokenApprove(
    contractCalls: Parameters<typeof fa2helper.wrapContractCallsWithApprove>[0]['contractCalls'],
    token: FA2Token,
    ticketHelperContractAddress: string
  ): Promise<BatchOperation> {
    const [tokenContract, tokenOwnerAddress] = await Promise.all([
      this.tezosToolkit.contract.at<FA2Contract>(token.address),
      this.tezosToolkit.wallet.pkh()
    ]);
    const resultOperation = fa2helper.wrapContractCallsWithApprove({
      toolkit: this.tezosToolkit,
      approvedAddress: ticketHelperContractAddress,
      ownerAddress: tokenOwnerAddress,
      tokenId: token.tokenId,
      tokenContract,
      contractCalls
    });

    return resultOperation.send();
  }
}
