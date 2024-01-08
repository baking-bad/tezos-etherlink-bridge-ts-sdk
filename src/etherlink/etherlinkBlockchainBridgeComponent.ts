import type Web3 from 'web3';
// eslint-disable-next-line no-duplicate-imports
import type { TransactionReceipt } from 'web3';

import { kernelContractAbi, type KernelContract } from './contracts';
import { converters } from '../utils';

interface WithdrawParams {
  tezosReceiverAddress: string;
  amount: bigint;
  tezosTicketerContent: string;
  etherlinkSenderAddress: string;
  etherlinkTokenProxyContractAddress: string;
  tezosTicketerAddress: string;
  tezosRouterAddress: string;
}

export interface EtherlinkBlockchainBridgeComponentOptions {
  etherlinkToolkit: Web3;
  kernelContractAddress: string;
}

export class EtherlinkBlockchainBridgeComponent {
  protected readonly etherlinkToolkit: Web3;
  protected readonly kernelContract: KernelContract;
  protected readonly kernelContractAddress: string;

  constructor(options: EtherlinkBlockchainBridgeComponentOptions) {
    this.etherlinkToolkit = options.etherlinkToolkit;
    this.kernelContractAddress = options.kernelContractAddress;

    this.kernelContract = new this.etherlinkToolkit.eth.Contract(
      kernelContractAbi,
      this.kernelContractAddress
    );
  }

  async withdraw(params: WithdrawParams): Promise<TransactionReceipt> {
    const tezosReceiverAddressBytes = converters.convertTezosAddressToBytes(params.tezosReceiverAddress, true);
    const tezosTicketerAddressBytes = converters.convertTezosAddressToBytes(params.tezosTicketerAddress, true);
    const tezosProxyAddressBytes = converters.convertTezosAddressToBytes(params.tezosRouterAddress);
    const receiverBytes = tezosReceiverAddressBytes + tezosProxyAddressBytes;

    const data = this.kernelContract.methods
      .withdraw(
        params.etherlinkTokenProxyContractAddress,
        receiverBytes,
        params.amount,
        tezosTicketerAddressBytes,
        params.tezosTicketerContent
      )
      .encodeABI();

    // TODO: refactoring
    const gasPrice = await this.etherlinkToolkit.eth.getGasPrice();
    const receipt: TransactionReceipt = await this.etherlinkToolkit.eth.sendTransaction({
      from: params.etherlinkSenderAddress,
      to: this.kernelContractAddress,
      gas: BigInt('30000'), // TODO: need to calculate the value or hardcode it in config 
      gasPrice,             // without gasPrice we get the 'Network doesn't support eip-1559' exception
      data,
    });

    return receipt;
  }
}
