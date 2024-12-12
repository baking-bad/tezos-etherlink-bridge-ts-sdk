import { Contract, ContractTransaction, ContractTransactionResponse, type Signer } from 'ethers';

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
  protected readonly signer: Signer;
  protected readonly nativeTokenBridgePrecompiledAddress: string;
  protected readonly nonNativeTokenBridgePrecompiledAddress: string;
  protected readonly nativeTokenBridgePrecompile: Contract;
  protected readonly nonNativeTokenBridgePrecompile: Contract;

  constructor(options: EthersEtherlinkBridgeBlockchainServiceOptions) {
    this.signer = options.signer;
    this.nativeTokenBridgePrecompiledAddress = options.nativeTokenBridgePrecompileAddress || defaultAddresses.nativeTokenBridgePrecompileAddress;
    this.nonNativeTokenBridgePrecompiledAddress = options.nonNativeTokenBridgePrecompileAddress || defaultAddresses.nonNativeTokenBridgePrecompileAddress;

    this.nativeTokenBridgePrecompile = new Contract(
      this.nativeTokenBridgePrecompiledAddress,
      nativeTokenBridgePrecompile,
      this.signer
    );
    this.nonNativeTokenBridgePrecompile = new Contract(
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

  protected getCurrentTransactionTimestamp() {
    return new Date().toISOString();
  }

  private async withdrawToken(
    contract: Contract,
    transaction: ContractTransaction,
    amount: bigint
  ) {
    const transactionResponse = await this.signer.sendTransaction(transaction);
    const contractTransactionResponse = new ContractTransactionResponse(contract.interface, this.signer.provider!, transactionResponse);

    return {
      hash: contractTransactionResponse.hash,
      amount,
      timestamp: this.getCurrentTransactionTimestamp(),
      tx: contractTransactionResponse
    };
  }
}
