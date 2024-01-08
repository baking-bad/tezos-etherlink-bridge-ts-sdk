import { packDataBytes } from '@taquito/michel-codec';
import { Schema } from '@taquito/michelson-encoder';
import type { TezosToolkit } from '@taquito/taquito';
import type BigNumber from 'bignumber.js';
import type Web3 from 'web3';

import type { DepositTokensOperationResult, WithdrawTokensOperationResult } from './bridgeOperations';
import type { Network } from './common';
import { EtherlinkBlockchainBridgeComponent, type EtherlinkToken } from './etherlink';
import {
  TezosBlockchainBridgeComponent, tezosTicketerContentMichelsonType,
  type TezosToken
} from './tezos';
import { TokenBridgeOptions } from './tokenBridgeOptions';
import { converters } from './utils';

export class TokenBridge {
  readonly network: Network;

  protected readonly tezosToolkit: TezosToolkit;
  protected readonly etherlinkToolkit: Web3;
  protected readonly tezosBlockchainBridgeComponent: TezosBlockchainBridgeComponent;
  protected readonly etherlinkBlockchainBridgeComponent: EtherlinkBlockchainBridgeComponent;

  protected readonly tezosTicketerContentSchema = new Schema(tezosTicketerContentMichelsonType);

  constructor(options: TokenBridgeOptions) {
    // TODO: validate the network
    this.network = options.network;
    this.tezosToolkit = options.tezos.toolkit;
    this.etherlinkToolkit = options.etherlink.toolkit;

    this.tezosBlockchainBridgeComponent = new TezosBlockchainBridgeComponent({
      tezosToolkit: this.tezosToolkit,
      rollupAddress: options.tezos.bridgeOptions.rollupAddress
    });
    this.etherlinkBlockchainBridgeComponent = new EtherlinkBlockchainBridgeComponent({
      etherlinkToolkit: this.etherlinkToolkit,
      kernelContractAddress: options.etherlink.bridgeOptions.kernelContractAddress
    });
  }

  async deposit(token: TezosToken, amount: BigNumber, etherlinkReceiverAddress?: string): Promise<DepositTokensOperationResult> {
    if (!etherlinkReceiverAddress) {
      etherlinkReceiverAddress = await this.getEtherlinkConnectedAddress();
    }

    const amountBigInt = converters.convertTokensAmountToBigInt(amount, await this.getTokenDecimals(token));
    const ticketHelperContractAddress = 'ticketHelperContractAddress';
    const etherlinkTokenProxyContractAddress = 'etherlinkTokenProxyContractAddress';

    const depositOperation = await this.tezosBlockchainBridgeComponent.deposit({
      token,
      amount: amountBigInt,
      etherlinkReceiverAddress,
      ticketHelperContractAddress,
      etherlinkTokenProxyContractAddress
    });
    await depositOperation.confirmation();

    return {

    };
  }

  async startWithdraw(token: EtherlinkToken, amount: BigNumber, tezosReceiverAddress?: string): Promise<WithdrawTokensOperationResult> {
    if (!tezosReceiverAddress) {
      tezosReceiverAddress = await this.getTezosConnectedAddress();
    }

    const tezosTicketerAddress = 'tezosTicketerAddress';
    const etherlinkTokenProxyContractAddress = 'etherlinkTokenProxyContractAddress';
    const tezosRouterAddress = 'tezosRouterAddress';

    const amountBigInt = converters.convertTokensAmountToBigInt(amount, await this.getTokenDecimals(token));
    const etherlinkConnectedAddress = await this.getEtherlinkConnectedAddress();
    const tezosTicketerContent = await this.getTezosTicketerContent(tezosTicketerAddress);

    const transactionReceipt = await this.etherlinkBlockchainBridgeComponent.withdraw({
      tezosReceiverAddress,
      amount: amountBigInt,
      tezosTicketerContent,
      etherlinkSenderAddress: etherlinkConnectedAddress,
      etherlinkTokenProxyContractAddress,
      tezosRouterAddress,
      tezosTicketerAddress
    });

    return {

    };
  }

  async finishWithdraw(): Promise<WithdrawTokensOperationResult> {
    return {

    };
  }

  private async getTezosConnectedAddress(): Promise<string> {
    return this.tezosToolkit.wallet.pkh();
  }

  private async getEtherlinkConnectedAddress(): Promise<string> {
    const accounts = await this.etherlinkToolkit.eth.getAccounts();
    const address = accounts[0];
    if (!address)
      throw new Error('Address is unavailable');

    return address;
  }

  private getTokenDecimals(_token: EtherlinkToken | TezosToken): Promise<number> {
    // TODO: implement
    return Promise.resolve(0);
  }

  private async getTezosTicketerContent(tezosTicketerAddress: string): Promise<string> {
    const contract = await this.tezosToolkit.contract.at(tezosTicketerAddress);
    const storage = await contract.storage<{ content: unknown }>();
    const contentMichelsonData = this.tezosTicketerContentSchema.Encode(storage.content);

    return packDataBytes(contentMichelsonData, tezosTicketerContentMichelsonType).bytes.slice(2);
  }
}
