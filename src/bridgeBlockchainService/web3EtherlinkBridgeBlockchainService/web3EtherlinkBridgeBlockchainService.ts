import type { Web3, TransactionReceipt } from 'web3';
import type { NonPayableMethodObject, PayableMethodObject } from 'web3-eth-contract';

import type { NativeTokenBridgePrecompile, NonNativeTokenBridgePrecompile } from './precompiles';
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

export interface Web3EtherlinkBridgeBlockchainServiceOptions {
  web3: Web3;
  kernelAddress?: string;
  nativeTokenBridgePrecompileAddress?: string;
  nonNativeTokenBridgePrecompileAddress?: string;
}

export class Web3EtherlinkBridgeBlockchainService implements EtherlinkBridgeBlockchainService<
  { receipt: TransactionReceipt },
  { receipt: TransactionReceipt },
  NonPayableMethodObject,
  NonPayableMethodObject
> {
  protected readonly web3: Web3;
  protected readonly nativeTokenBridgePrecompiledAddress: string;
  protected readonly nonNativeTokenBridgePrecompiledAddress: string;
  protected readonly nativeTokenBridgePrecompile: NativeTokenBridgePrecompile;
  protected readonly nonNativeTokenBridgePrecompile: NonNativeTokenBridgePrecompile;

  constructor(options: Web3EtherlinkBridgeBlockchainServiceOptions) {
    this.web3 = options.web3;
    this.nativeTokenBridgePrecompiledAddress = options.nativeTokenBridgePrecompileAddress || defaultAddresses.nativeTokenBridgePrecompileAddress;
    this.nonNativeTokenBridgePrecompiledAddress = options.nonNativeTokenBridgePrecompileAddress || defaultAddresses.nonNativeTokenBridgePrecompileAddress;

    this.nativeTokenBridgePrecompile = new this.web3.eth.Contract(
      nativeTokenBridgePrecompile,
      this.nativeTokenBridgePrecompiledAddress
    );
    this.nonNativeTokenBridgePrecompile = new this.web3.eth.Contract(
      nonNativeTokenBridgePrecompile,
      this.nonNativeTokenBridgePrecompiledAddress
    );
  }

  async getSignerAddress(): Promise<string | undefined> {
    try {
      const accounts = await this.web3.eth.getAccounts();
      return accounts[0] || this.web3.eth.defaultAccount;
    }
    catch (error) {
      loggerProvider.logger.error(getErrorLogMessage(error));
      return undefined;
    }
  }

  async withdrawNativeToken(params: WithdrawNativeTokenParams): Promise<WithdrawNativeTokenResult & { receipt: TransactionReceipt }> {
    const nativeTokenOperation = await this.createWithdrawNativeTokenOperation(params);

    return this.withdrawToken(nativeTokenOperation, this.nativeTokenBridgePrecompiledAddress, params.amount, params.amount);
  }

  async withdrawNonNativeToken(params: WithdrawNonNativeTokenParams): Promise<WithdrawNonNativeTokenResult & { receipt: TransactionReceipt }> {
    const nonNativeTokenOperation = await this.createWithdrawNonNativeTokenOperation(params);

    return this.withdrawToken(nonNativeTokenOperation, this.nonNativeTokenBridgePrecompiledAddress, undefined, params.amount);
  }

  createWithdrawNativeTokenOperation(params: CreateWithdrawNativeTokenOperationParams) {
    return Promise.resolve(this.nativeTokenBridgePrecompile.methods.withdraw_base58(params.tezosReceiverAddress));
  }

  createWithdrawNonNativeTokenOperation(params: CreateWithdrawNonNativeTokenOperationParams) {
    const tezosReceiverAddressBytes = tezosUtils.convertAddressToBytes(params.tezosReceiverAddress, true);
    const tezosTicketerAddressBytes = tezosUtils.convertAddressToBytes(params.tezosTicketerAddress, true);
    const tezosProxyAddressBytes = tezosUtils.convertAddressToBytes(params.tezosTicketerAddress);
    const receiverBytes = tezosReceiverAddressBytes + tezosProxyAddressBytes;

    return Promise.resolve(this.nonNativeTokenBridgePrecompile.methods
      .withdraw(
        params.token.address,
        receiverBytes,
        params.amount,
        tezosTicketerAddressBytes,
        params.tezosTicketerContent
      ));
  }

  protected getCurrentTransactionTimestamp() {
    return new Date().toISOString();
  }

  private async withdrawToken(
    operation: PayableMethodObject<unknown[], unknown[]> | NonPayableMethodObject<unknown[], unknown[]>,
    targetAddress: string,
    value: bigint | undefined,
    amount: bigint,
    bufferPercentage = 5n
  ) {
    const [gasPrice, signerAddress] = await Promise.all([
      this.web3.eth.getGasPrice(),
      this.getSignerAddress()
    ]);
    const data = operation.encodeABI();

    const estimatedGas = await this.web3.eth.estimateGas({
      from: signerAddress,
      to: targetAddress,
      data,
      value
    });
    const receipt = await this.web3.eth.sendTransaction({
      from: signerAddress,
      to: targetAddress,
      gas: estimatedGas + (estimatedGas * bufferPercentage / 100n),
      gasPrice,
      data,
      value
    });

    return {
      hash: receipt.transactionHash.toString(),
      amount,
      timestamp: this.getCurrentTransactionTimestamp(),
      receipt
    };
  }
}
