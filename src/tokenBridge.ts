import { packDataBytes } from '@taquito/michel-codec';
import { Schema } from '@taquito/michelson-encoder';
import type { TezosToolkit } from '@taquito/taquito';
import BigNumber from 'bignumber.js';
import type Web3 from 'web3';

import { BridgeDataProvider } from './bridgeDataProvider';
import {
  BridgeTokenTransferKind,
  type BridgeTokenDeposit, type FinishedBridgeTokenWithdrawal, type CreatedBridgeTokenWithdrawal, BridgeTokenTransferStatus
} from './bridgeOperations';
import type { Network } from './common';
import { EtherlinkBlockchainBridgeComponent, type EtherlinkToken } from './etherlink';
import {
  TezosBlockchainBridgeComponent, tezosTicketerContentMichelsonType,
  type TezosToken
} from './tezos';
import { TokenBridgeOptions } from './tokenBridgeOptions';
import { converters, tezosUtils } from './utils';

export class TokenBridge {
  readonly network: Network;
  readonly bridgeDataProvider: BridgeDataProvider;

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
    this.bridgeDataProvider = options.bridgeDataProvider;

    this.tezosBlockchainBridgeComponent = new TezosBlockchainBridgeComponent({
      tezosToolkit: this.tezosToolkit,
      rollupAddress: options.tezos.bridgeOptions.rollupAddress
    });
    this.etherlinkBlockchainBridgeComponent = new EtherlinkBlockchainBridgeComponent({
      etherlinkToolkit: this.etherlinkToolkit,
      kernelAddress: options.etherlink.bridgeOptions.kernelAddress,
      withdrawPrecompileAddress: options.etherlink.bridgeOptions.withdrawPrecompileAddress
    });
  }

  async deposit(
    token: TezosToken,
    amount: BigNumber | string | bigint | number,
    etherlinkReceiverAddress?: string
  ): Promise<BridgeTokenDeposit> {
    if (!etherlinkReceiverAddress) {
      etherlinkReceiverAddress = await this.getEtherlinkConnectedAddress();
    }

    const amountBigInt = await this.prepareAmount(amount, token);
    const tokenPair = await this.bridgeDataProvider.getRegisteredTokenPair(token);
    if (!tokenPair)
      throw new Error(`Token (${token.address}) is not listed`);

    const ticketHelperContractAddress = tokenPair.tezos.tickerHelperContractAddress;
    const etherlinkTokenProxyContractAddress = tokenPair.etherlink.token.address;
    if (!ticketHelperContractAddress)
      throw new Error('The direct deposit is not yet available');

    const depositOperation = await this.tezosBlockchainBridgeComponent.deposit({
      token,
      amount: amountBigInt,
      etherlinkReceiverAddress,
      ticketHelperContractAddress,
      etherlinkTokenProxyContractAddress
    });
    await depositOperation.confirmation();

    return {
      kind: BridgeTokenTransferKind.Deposit,
      status: BridgeTokenTransferStatus.Created,
      tezosOperation: {
        blockId: depositOperation.includedInBlock,
        hash: depositOperation.hash,
        // TODO: receive timestamp
        timestamp: Date.now().toString(),
        amount: amountBigInt,
        fee: tezosUtils.getOperationTotalCost(depositOperation),
        source: depositOperation.source,
        // TODO: receive the sender
        sender: '',
        receiver: etherlinkReceiverAddress,
        token,
      }
    };
  }

  async startWithdraw(token: EtherlinkToken, amount: BigNumber, tezosReceiverAddress?: string): Promise<CreatedBridgeTokenWithdrawal> {
    if (!tezosReceiverAddress) {
      tezosReceiverAddress = await this.getTezosConnectedAddress();
    }

    const tezosTicketerAddress = 'tezosTicketerAddress';
    const etherlinkTokenProxyContractAddress = 'etherlinkTokenProxyContractAddress';
    const tezosProxyAddress = 'tezosProxyAddress';

    const amountBigInt = await this.prepareAmount(amount, token);
    const etherlinkConnectedAddress = await this.getEtherlinkConnectedAddress();
    const tezosTicketerContent = await this.getTezosTicketerContent(tezosTicketerAddress);

    const withdrawalTransactionReceipt = await this.etherlinkBlockchainBridgeComponent.withdraw({
      tezosReceiverAddress,
      amount: amountBigInt,
      tezosTicketerContent,
      etherlinkSenderAddress: etherlinkConnectedAddress,
      etherlinkTokenProxyContractAddress,
      tezosProxyAddress,
      tezosTicketerAddress
    });
    const gasPrice = await this.etherlinkToolkit.eth.getGasPrice();

    return {
      kind: BridgeTokenTransferKind.Withdrawal,
      status: BridgeTokenTransferStatus.Created,
      etherlinkOperation: {
        blockId: +withdrawalTransactionReceipt.blockNumber.toString(10),
        hash: withdrawalTransactionReceipt.transactionHash.toString(),
        // TODO: receive timestamp
        timestamp: Date.now().toString(),
        amount: amountBigInt,
        fee: BigInt(withdrawalTransactionReceipt.gasUsed) * gasPrice,
        source: withdrawalTransactionReceipt.from,
        receiver: tezosReceiverAddress,
        token,
      }
    };
  }

  async finishWithdraw(BridgeTokenPartialWithdrawal: CreatedBridgeTokenWithdrawal): Promise<FinishedBridgeTokenWithdrawal> {
    throw new Error('Not implemented');
  }

  private async getTezosConnectedAddress(): Promise<string> {
    return this.tezosToolkit.wallet.pkh();
  }

  private async getEtherlinkConnectedAddress(): Promise<string> {
    const accounts = await this.etherlinkToolkit.eth.getAccounts();
    const address = accounts[0] || this.etherlinkToolkit.eth.defaultAccount;
    if (!address)
      throw new Error('Address is unavailable');

    return address;
  }

  private async prepareAmount(amount: BigNumber | string | bigint | number, token: EtherlinkToken | TezosToken): Promise<bigint> {
    if (typeof amount === 'bigint')
      return amount;

    const tokenDecimals = await this.getTokenDecimals(token);
    return converters.convertTokensAmountToBigInt(new BigNumber(amount), tokenDecimals);
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
