import type { Web3, TransactionReceipt } from 'web3';
import type { NonPayableMethodObject } from 'web3-eth-contract';

import type { WithdrawNonNativeTokenPrecompile } from './precompiles';
import { getErrorLogMessage, loggerProvider } from '../../logging';
import { tezosUtils } from '../../utils';
import {
  kernelContractAbi,
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
  withdrawNativeTokenPrecompileAddress?: string;
  withdrawNonNativeTokenPrecompileAddress?: string;
}

export class Web3EtherlinkBridgeBlockchainService implements EtherlinkBridgeBlockchainService<
  { receipt: TransactionReceipt },
  { receipt: TransactionReceipt },
  NonPayableMethodObject,
  NonPayableMethodObject
> {
  protected readonly web3: Web3;
  protected readonly withdrawNativeTokenPrecompiledAddress: string;
  protected readonly withdrawNonNativeTokenPrecompiledAddress: string;
  protected readonly withdrawNonNativeTokenPrecompile: WithdrawNonNativeTokenPrecompile;

  constructor(options: Web3EtherlinkBridgeBlockchainServiceOptions) {
    this.web3 = options.web3;
    this.withdrawNativeTokenPrecompiledAddress = options.withdrawNativeTokenPrecompileAddress || defaultAddresses.withdrawNativeTokenPrecompileAddress;
    this.withdrawNonNativeTokenPrecompiledAddress = options.withdrawNonNativeTokenPrecompileAddress || defaultAddresses.withdrawNonNativeTokenPrecompileAddress;

    this.withdrawNonNativeTokenPrecompile = new this.web3.eth.Contract(
      kernelContractAbi,
      this.withdrawNonNativeTokenPrecompiledAddress
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

  withdrawNativeToken(_params: WithdrawNativeTokenParams): Promise<WithdrawNativeTokenResult & { receipt: TransactionReceipt }> {
    throw new Error('Withdrawal of native tokens is not supported yet');
  }

  async withdrawNonNativeToken(params: WithdrawNonNativeTokenParams): Promise<WithdrawNonNativeTokenResult & { receipt: TransactionReceipt }> {
    const [nonNativeTokenOperation, gasPrice, signerAddress] = await Promise.all([
      this.createDepositNonNativeTokenOperation(params),
      this.web3.eth.getGasPrice(),
      this.getSignerAddress()
    ]);
    const data = nonNativeTokenOperation.encodeABI();

    const estimatedGas = await this.web3.eth.estimateGas({
      from: signerAddress,
      to: this.withdrawNonNativeTokenPrecompiledAddress,
      data,
    });
    const receipt = await this.web3.eth.sendTransaction({
      from: signerAddress,
      to: this.withdrawNonNativeTokenPrecompiledAddress,
      gas: estimatedGas + (estimatedGas * 5n / 100n),
      gasPrice,
      data,
    });

    return {
      hash: receipt.transactionHash.toString(),
      amount: params.amount,
      timestamp: this.getCurrentTransactionTimestamp(),
      receipt
    };
  }

  createDepositNativeTokenOperation(_params: CreateWithdrawNativeTokenOperationParams): Promise<NonPayableMethodObject<unknown[], unknown[]>> {
    throw new Error('Withdrawal of native tokens is not supported yet');
  }

  createDepositNonNativeTokenOperation(params: CreateWithdrawNonNativeTokenOperationParams): Promise<NonPayableMethodObject<unknown[], unknown[]>> {
    const tezosReceiverAddressBytes = tezosUtils.convertAddressToBytes(params.tezosReceiverAddress, true);
    const tezosTicketerAddressBytes = tezosUtils.convertAddressToBytes(params.tezosTicketerAddress, true);
    const tezosProxyAddressBytes = tezosUtils.convertAddressToBytes(params.tezosTicketerAddress);
    const receiverBytes = tezosReceiverAddressBytes + tezosProxyAddressBytes;

    return Promise.resolve(this.withdrawNonNativeTokenPrecompile.methods
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
}
