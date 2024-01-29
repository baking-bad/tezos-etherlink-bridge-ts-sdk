import { LocalForger } from '@taquito/local-forging';
import type { OperationContentsSmartRollupExecuteOutboxMessage } from '@taquito/rpc';
import { OpKind, type TezosToolkit, type Wallet, type ContractProvider, type ParamsWithKind } from '@taquito/taquito';

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
      storage_limit: '100',
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
