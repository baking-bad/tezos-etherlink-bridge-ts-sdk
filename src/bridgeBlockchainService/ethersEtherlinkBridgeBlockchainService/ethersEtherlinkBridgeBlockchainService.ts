import type { ethers, Contract, ContractTransaction, ContractTransactionResponse, Signer } from 'ethers';

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

export interface EthersEtherlinkBridgeBlockchainServiceOptions {
  ethers: typeof ethers;
  signer: Signer;
  kernelAddress?: string;
  nativeTokenBridgePrecompileAddress?: string;
  nonNativeTokenBridgePrecompileAddress?: string;
}

export class EthersEtherlinkBridgeBlockchainService implements EtherlinkBridgeBlockchainService<
  { tx: ContractTransactionResponse },
  { tx: ContractTransactionResponse },
  ContractTransaction,
  ContractTransaction
> {
  readonly ethers: typeof ethers;

  protected readonly nativeTokenBridgePrecompiledAddress: string;
  protected readonly nonNativeTokenBridgePrecompiledAddress: string;
  protected readonly nativeTokenBridgePrecompile: Contract;
  protected readonly nonNativeTokenBridgePrecompile: Contract;
  private _signer: Signer;

  constructor(options: EthersEtherlinkBridgeBlockchainServiceOptions) {
    this.ethers = options.ethers;
    this.nativeTokenBridgePrecompiledAddress = options.nativeTokenBridgePrecompileAddress || defaultAddresses.nativeTokenBridgePrecompileAddress;
    this.nonNativeTokenBridgePrecompiledAddress = options.nonNativeTokenBridgePrecompileAddress || defaultAddresses.nonNativeTokenBridgePrecompileAddress;
    this._signer = options.signer;

    this.nativeTokenBridgePrecompile = new this.ethers.Contract(
      this.nativeTokenBridgePrecompiledAddress,
      nativeTokenBridgePrecompile,
      this._signer
    );
    this.nonNativeTokenBridgePrecompile = new this.ethers.Contract(
      this.nonNativeTokenBridgePrecompiledAddress,
      nonNativeTokenBridgePrecompile,
      this._signer
    );
  }

  get signer() {
    return this._signer;
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

  async withdrawNativeToken(params: WithdrawNativeTokenParams): Promise<WithdrawNativeTokenResult & { tx: ContractTransactionResponse }> {
    const nativeTokenOperation = await this.createWithdrawNativeTokenOperation(params);

    return this.withdrawToken(this.nativeTokenBridgePrecompile, nativeTokenOperation, params.amount);
  }

  async withdrawNonNativeToken(params: WithdrawNonNativeTokenParams): Promise<WithdrawNonNativeTokenResult & { tx: ContractTransactionResponse }> {
    const nonNativeTokenOperation = await this.createWithdrawNonNativeTokenOperation(params);

    return this.withdrawToken(this.nonNativeTokenBridgePrecompile, nonNativeTokenOperation, params.amount);
  }

  createWithdrawNativeTokenOperation(params: CreateWithdrawNativeTokenOperationParams) {
    return Promise.resolve(this.nativeTokenBridgePrecompile
      .getFunction('withdraw_base58')
      .populateTransaction(params.tezosReceiverAddress, { value: params.amount }));
  }

  createWithdrawNonNativeTokenOperation(params: CreateWithdrawNonNativeTokenOperationParams) {
    const tezosReceiverAddressBytes = tezosUtils.convertAddressToBytes(params.tezosReceiverAddress, true);
    const tezosTicketerAddressBytes = tezosUtils.convertAddressToBytes(params.tezosTicketerAddress, true);
    const tezosProxyAddressBytes = tezosUtils.convertAddressToBytes(params.tezosTicketerAddress);
    const receiverBytes = tezosReceiverAddressBytes + tezosProxyAddressBytes;

    return Promise.resolve(this.nonNativeTokenBridgePrecompile.getFunction('withdraw')
      .populateTransaction(
        params.token.address,
        receiverBytes,
        params.amount,
        tezosTicketerAddressBytes,
        params.tezosTicketerContent
      )
    );
  }

  setSigner(signer: Signer) {
    this._signer = signer;
  }

  protected getCurrentTransactionTimestamp() {
    return new Date().toISOString();
  }

  private async withdrawToken(
    contract: Contract,
    transaction: ContractTransaction,
    amount: bigint
  ) {
    const transactionResponse = await this.signer.sendTransaction(transaction);
    const contractTransactionResponse = new this.ethers.ContractTransactionResponse(contract.interface, this.signer.provider!, transactionResponse);

    return {
      hash: contractTransactionResponse.hash,
      amount,
      timestamp: this.getCurrentTransactionTimestamp(),
      tx: contractTransactionResponse
    };
  }
}
