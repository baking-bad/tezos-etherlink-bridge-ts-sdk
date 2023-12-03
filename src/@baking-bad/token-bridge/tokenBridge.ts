import BigNumber from 'bignumber.js';

import { Blockchain, Token } from './blockchain/blockchain';
import { BridgeDataProvider } from './dataProvider/dataProvider';

export interface SuccessSwapResult {
  success: true;
  token1: Token;
  token2: Token;
}

export interface FailedSwapResult {
  success: false;
  error: string;
}

export type SwapResult = SuccessSwapResult | FailedSwapResult;

export interface RevertSwapResult {
  // TODO
}

// TODO
export type SwapOperationStatus =
  | '';

export interface SwapOperation {
  blockchain1Name: string;
  blockchain2Name: string;
  token1: Token;
  token2: Token;
  amount: BigNumber;
  isForward: boolean;
  status: SwapOperationStatus;
}

export interface TokenBridgeOptions<TBlockchain1 extends Blockchain, TBlockchain2 extends Blockchain> {
  network: 'mainnet' | 'testnet';
  blockchain1: TBlockchain1;
  blockchain2: TBlockchain2;
  bridgeDataProvider: BridgeDataProvider;
}

export class TokenBridge<TBlockchain1 extends Blockchain, TBlockchain2 extends Blockchain> {
  readonly network: 'mainnet' | 'testnet';
  readonly bridgeDataProvider: BridgeDataProvider;

  constructor(options: TokenBridgeOptions<TBlockchain1, TBlockchain2>) {
    console.log(options);
    this.network = options.network;
    this.bridgeDataProvider = options.bridgeDataProvider;
  }

  async swap(token: Parameters<TBlockchain1['sendTokens']>[0], amount: BigNumber, isForward: true): Promise<SwapResult>;
  async swap(token: Parameters<TBlockchain2['sendTokens']>[0], amount: BigNumber, isForward: false): Promise<SwapResult>;
  async swap(
    token: Parameters<TBlockchain1['sendTokens']>[0] | Parameters<TBlockchain2['sendTokens']>[0],
    amount: BigNumber,
    isForward: boolean
  ): Promise<SwapResult> {
    // Do we need to allow automate revert operations?
    console.log(token, amount, isForward);

    throw new Error('Not implemented!');
  }

  async revertFailedSwap(failedSwapResult: SwapResult): Promise<RevertSwapResult> {
    console.log(failedSwapResult);

    throw new Error('Not implemented!');
  }
}
