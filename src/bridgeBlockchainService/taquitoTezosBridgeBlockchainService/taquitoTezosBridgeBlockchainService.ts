import { packDataBytes } from '@taquito/michel-codec';
import { Schema } from '@taquito/michelson-encoder';
import type { TezosToolkit, Wallet, ContractProvider, ContractMethod } from '@taquito/taquito';

import type { FA12Contract, FA2Contract, NativeTokenTicketHelper, NonNativeTokenTicketHelper } from './contracts';
import { TezosSignerAccountUnavailableError } from './errors';
import { fa12helper, fa2helper } from './helpers';
import { tezosTicketerContentMichelsonType } from './tezosTicketerContentMichelsonType';
import { getErrorLogMessage, loggerProvider } from '../../logging';
import type { FA12TezosToken, FA2TezosToken } from '../../tokens';
import { etherlinkUtils } from '../../utils';
import type {
  TezosBridgeBlockchainService,
  DepositNativeTokenParams, DepositNonNativeTokensParams, FinishWithdrawParams,
  DepositNativeTokenResult, DepositNonNativeTokenResult, FinishWithdrawResult,
  CreateDepositNativeTokenOperationParams, CreateDepositNonNativeTokenOperationParams,
} from '../tezosBridgeBlockchainService';

export interface TaquitoTezosBridgeBlockchainServiceOptions {
  tezosToolkit: TezosToolkit;
  smartRollupAddress: string;
}

export abstract class TaquitoTezosBridgeBlockchainService<
  TApi extends ContractProvider | Wallet
> implements TezosBridgeBlockchainService<
  DepositNativeTokenResult & { operation: Awaited<ReturnType<ContractMethod<TApi>['send']>> },
  DepositNonNativeTokenResult & { operation: Awaited<ReturnType<ReturnType<TApi['batch']>['send']>> },
  FinishWithdrawResult & { operation: Awaited<ReturnType<ContractProvider['smartRollupExecuteOutboxMessage']>> },
  ContractMethod<TApi>,
  ContractMethod<TApi>
> {
  readonly smartRollupAddress: string;

  protected readonly tezosToolkit: TezosToolkit;
  protected readonly tezosTicketerContentSchema = new Schema(tezosTicketerContentMichelsonType);

  constructor(options: TaquitoTezosBridgeBlockchainServiceOptions) {
    this.smartRollupAddress = options.smartRollupAddress;
    this.tezosToolkit = options.tezosToolkit;
  }

  async getSignerAddress(): Promise<string | undefined> {
    try {
      return await this.tezosToolkit.signer.publicKeyHash();
    }
    catch (error) {
      loggerProvider.logger.error(getErrorLogMessage(error));

      return undefined;
    }
  }

  abstract depositNativeToken(
    params: DepositNativeTokenParams
  ): Promise<DepositNativeTokenResult & { operation: Awaited<ReturnType<ContractMethod<TApi>['send']>>; }>;

  abstract depositNonNativeToken(
    params: DepositNonNativeTokensParams
  ): Promise<DepositNonNativeTokenResult & { operation: Awaited<ReturnType<ReturnType<TApi['batch']>['send']>>; }>;

  abstract finishWithdraw(
    params: FinishWithdrawParams
  ): Promise<FinishWithdrawResult & { operation: Awaited<ReturnType<ContractProvider['smartRollupExecuteOutboxMessage']>>; }>;

  async createDepositNativeTokenOperation(params: CreateDepositNativeTokenOperationParams) {
    const ticketHelperContract = await this.getNativeTokenTicketHelperContract(params.ticketHelperContractAddress);
    const routingInfo = this.packDepositRoutingInfo(params.etherlinkReceiverAddress);

    const operation = ticketHelperContract.methodsObject.deposit({
      evm_address: this.smartRollupAddress,
      l2_address: routingInfo,
    });

    return operation;
  }

  async createDepositNonNativeTokenOperation(params: CreateDepositNonNativeTokenOperationParams) {
    const ticketHelperContract = await this.getNonNativeTokenTicketHelperContract(params.ticketHelperContractAddress);
    const routingInfo = this.packDepositRoutingInfo(params.etherlinkReceiverAddress);

    const operation = ticketHelperContract.methodsObject.deposit({
      rollup: this.smartRollupAddress,
      receiver: routingInfo,
      amount: params.amount
    });

    return operation;
  }

  async getTezosTicketerContent(tezosTicketerAddress: string): Promise<string> {
    const storage = await this.tezosToolkit.contract.getStorage<{ content: any }>(tezosTicketerAddress);
    const content = [...Object.values(storage.content)];
    const contentMichelsonData = this.tezosTicketerContentSchema.Encode(content);

    return '0x' + packDataBytes(contentMichelsonData, tezosTicketerContentMichelsonType).bytes.slice(2);
  }

  protected async depositNativeTokenInternal(params: DepositNativeTokenParams) {
    const depositOperation = await this.createDepositNativeTokenOperation(params);

    return depositOperation.send({
      amount: Number(params.amount),
      mutez: true
    }) as Promise<Awaited<ReturnType<ContractMethod<TApi>['send']>>>;
  }

  protected async depositNonNativeTokenInternal(params: DepositNonNativeTokensParams): Promise<Awaited<ReturnType<ReturnType<TApi['batch']>['send']>>> {
    const useApprove = params.useApprove ?? true;
    const depositOperation = await this.createDepositNonNativeTokenOperation(params);

    let batch = this.createBatch();

    if (useApprove) {
      batch = await (params.token.type === 'fa2'
        ? this.wrapContractCallsWithFA2TokenApprove(
          batch,
          depositOperation,
          params.token,
          params.ticketHelperContractAddress
        )
        : this.wrapContractCallsWithFA12TokenApprove(
          batch,
          depositOperation,
          params.amount,
          params.token,
          params.ticketHelperContractAddress,
          params.resetFA12Approve ?? true
        ));
    }

    return batch.send() as Promise<Awaited<ReturnType<ReturnType<TApi['batch']>['send']>>>;
  }

  protected finishWithdrawInternal(params: FinishWithdrawParams) {
    return this.tezosToolkit.contract.smartRollupExecuteOutboxMessage({
      rollup: this.smartRollupAddress,
      cementedCommitment: params.cementedCommitment,
      outputProof: params.outputProof
    });
  }

  protected getCurrentOperationTimestamp() {
    return new Date().toISOString();
  }

  protected async wrapContractCallsWithFA12TokenApprove(
    batch: ReturnType<TApi['batch']>,
    contractCalls: Parameters<typeof fa12helper.wrapContractCallsWithApprove>[0]['contractCalls'],
    amount: bigint,
    token: FA12TezosToken,
    ticketHelperContractAddress: string,
    isNeedToReset: boolean
  ): Promise<ReturnType<TApi['batch']>> {
    const tokenContract = await this.getFA12TokenContract(token.address);
    const resultOperation = fa12helper.wrapContractCallsWithApprove({
      batch,
      approvedAddress: ticketHelperContractAddress,
      approvedAmount: amount,
      tokenContract,
      contractCalls,
      isNeedToReset
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
      this.getSignerAddress()
    ]);

    if (!tokenOwnerAddress)
      throw new TezosSignerAccountUnavailableError();

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

  protected packDepositRoutingInfo(etherlinkReceiverAddress: string): string {
    return etherlinkUtils.prepareHexPrefix(etherlinkReceiverAddress, false);
  }

  protected abstract createBatch(params?: Parameters<TApi['batch']>[0]): ReturnType<TApi['batch']>;
  protected abstract getNativeTokenTicketHelperContract(ticketHelperContractAddress: string): Promise<NativeTokenTicketHelper<TApi>>;
  protected abstract getNonNativeTokenTicketHelperContract(ticketHelperContractAddress: string): Promise<NonNativeTokenTicketHelper<TApi>>;
  protected abstract getFA12TokenContract(fa12TokenContractAddress: string): Promise<FA12Contract<TApi>>;
  protected abstract getFA2TokenContract(fa2TokenContractAddress: string): Promise<FA2Contract<TApi>>;
}
