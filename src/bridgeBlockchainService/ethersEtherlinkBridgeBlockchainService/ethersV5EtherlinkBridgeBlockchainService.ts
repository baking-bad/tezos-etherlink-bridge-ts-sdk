import type { ethers, Contract, ContractTransaction, PopulatedTransaction, Signer } from 'ethers-v5';

import { getErrorLogMessage, loggerProvider } from '../../logging';
import { tezosUtils } from '../../utils';
import {
  nativeTokenBridgePrecompile,
  nonNativeTokenBridgePrecompile,
  defaultAddresses,
  type EtherlinkBridgeBlockchainService,
  type WithdrawNativeTokenParams,
  type WithdrawNativeTokenResult,
  type WithdrawNonNativeTokenParams,
  type WithdrawNonNativeTokenResult,
  type CreateWithdrawNativeTokenOperationParams,
  type CreateWithdrawNonNativeTokenOperationParams,
} from '../etherlinkBridgeBlockchainService';

export interface EthersV5EtherlinkBridgeBlockchainServiceOptions {
  ethers: typeof ethers;
  signer: Signer;
  kernelAddress?: string;
  nativeTokenBridgePrecompileAddress?: string;
  nonNativeTokenBridgePrecompileAddress?: string;
}

export class EthersV5EtherlinkBridgeBlockchainService implements EtherlinkBridgeBlockchainService<
  { tx: ContractTransaction },
  { tx: ContractTransaction },
  PopulatedTransaction,
  PopulatedTransaction
> {
  protected readonly ethers: typeof ethers;
  protected readonly signer: Signer;
  protected readonly nativeTokenBridgePrecompiledAddress: string;
  protected readonly nonNativeTokenBridgePrecompiledAddress: string;
  protected readonly nativeTokenBridgePrecompile: Contract;
  protected readonly nonNativeTokenBridgePrecompile: Contract;

  constructor(options: EthersV5EtherlinkBridgeBlockchainServiceOptions) {
    this.ethers = options.ethers;
    this.signer = options.signer;
    this.nativeTokenBridgePrecompiledAddress = options.nativeTokenBridgePrecompileAddress || defaultAddresses.nativeTokenBridgePrecompileAddress;
    this.nonNativeTokenBridgePrecompiledAddress = options.nonNativeTokenBridgePrecompileAddress || defaultAddresses.nonNativeTokenBridgePrecompileAddress;

    this.nativeTokenBridgePrecompile = new this.ethers.Contract(
      this.nativeTokenBridgePrecompiledAddress,
      nativeTokenBridgePrecompile,
      this.signer
    );
    this.nonNativeTokenBridgePrecompile = new this.ethers.Contract(
      this.nonNativeTokenBridgePrecompiledAddress,
      nonNativeTokenBridgePrecompile,
      this.signer
    );
  }

  async getSignerAddress(): Promise<string | undefined> {
    try {
      return this.signer.getAddress();
    }
    catch (error) {
      loggerProvider.logger.error(getErrorLogMessage(error));
      return undefined;
    }
  }

  async withdrawNativeToken(params: WithdrawNativeTokenParams): Promise<WithdrawNativeTokenResult & { tx: ContractTransaction }> {
    const nativeTokenOperation = await this.createWithdrawNativeTokenOperation(params);

    return this.withdrawToken(this.nativeTokenBridgePrecompile, nativeTokenOperation, params.amount);
  }

  async withdrawNonNativeToken(params: WithdrawNonNativeTokenParams): Promise<WithdrawNonNativeTokenResult & { tx: ContractTransaction }> {
    const nonNativeTokenOperation = await this.createWithdrawNonNativeTokenOperation(params);

    return this.withdrawToken(this.nonNativeTokenBridgePrecompile, nonNativeTokenOperation, params.amount);
  }

  createWithdrawNativeTokenOperation(params: CreateWithdrawNativeTokenOperationParams) {
    return Promise.resolve(this.nativeTokenBridgePrecompile
      .populateTransaction!
      .withdraw_base58!(params.tezosReceiverAddress, { value: params.amount }));
  }

  createWithdrawNonNativeTokenOperation(params: CreateWithdrawNonNativeTokenOperationParams) {
    const tezosReceiverAddressBytes = tezosUtils.convertAddressToBytes(params.tezosReceiverAddress, true);
    const tezosTicketerAddressBytes = tezosUtils.convertAddressToBytes(params.tezosTicketerAddress, true);
    const tezosProxyAddressBytes = tezosUtils.convertAddressToBytes(params.tezosTicketerAddress);
    const receiverBytes = tezosReceiverAddressBytes + tezosProxyAddressBytes;

    return Promise.resolve(this.nonNativeTokenBridgePrecompile
      .populateTransaction!
      .withdraw!(
        params.token.address,
        receiverBytes,
        params.amount,
        tezosTicketerAddressBytes,
        params.tezosTicketerContent
      )
    );
  }

  protected getCurrentTransactionTimestamp() {
    return new Date().toISOString();
  }

  private async withdrawToken(
    contract: Contract,
    transaction: PopulatedTransaction,
    amount: bigint
  ) {
    const transactionResponse = await this.signer.sendTransaction(transaction);

    return {
      hash: transactionResponse.hash,
      amount,
      timestamp: this.getCurrentTransactionTimestamp(),
      tx: transactionResponse
    };
  }
}
