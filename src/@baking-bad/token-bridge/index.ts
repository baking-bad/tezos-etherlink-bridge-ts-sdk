import { EventEmitter } from './eventEmitter';

export interface Token {
  blockchainName: string;
  address: string;
}

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

export interface Blockchain {
  name: string;
  rpcUrl: string;
}

export interface TokenBridgeOptions {
  network: 'mainnet' | 'testnet';
  blockchain1: Blockchain;
  blockchain2: Blockchain;
  // Do we need to support a bridge between two L1: chain1_L1 -> L2 -> chain2_L2?
  // blockchains: [Blockchain, Blockchain] | [Blockchain, Blockchain, Blockchain];
  bridgeDataProvider: BridgeDataProvider;
}

export class TokenBridge {
  readonly network: 'mainnet' | 'testnet';
  readonly bridgeDataProvider: BridgeDataProvider;

  constructor(options: TokenBridgeOptions) {
    console.log(options);
    this.network = options.network;
    this.bridgeDataProvider = options.bridgeDataProvider;
  }

  async swap(tokenAddress: string, isDirect: boolean): Promise<SwapResult> {
    // Do we need to allow automate revert operations?
    console.log(tokenAddress, isDirect);

    throw new Error('Not implemented!');
  }

  async revertFailedSwap(failedSwapResult: SwapResult): Promise<RevertSwapResult> {
    console.log(failedSwapResult);

    throw new Error('Not implemented!');
  }
}

interface TezosBlockchainOptions {
  rpcUrl: string;
}

export class TezosBlockchain implements Blockchain {
  readonly name: string = 'tezos';
  readonly rpcUrl: string;
  constructor(options: TezosBlockchainOptions) {
    this.rpcUrl = options.rpcUrl;
  }
}

export class EtherlinkBlockchain implements Blockchain {
  readonly name: string = 'etherlink';
  readonly rpcUrl: string;
  constructor(options: TezosBlockchainOptions) {
    this.rpcUrl = options.rpcUrl;
  }
}

interface SwapOperation {

}

interface BridgeDataProvider {
  events: {
    swapOperationUpdated: EventEmitter<readonly [args: any]>
  }

  getAllTokenPairs(): Promise<Array<readonly [Token, Token]>>;
  getSwapOperations(): Promise<SwapOperation[]>;
}

export class DipDupIndexerBridgeDataProvider implements BridgeDataProvider {
  readonly events = {
    swapOperationUpdated: new EventEmitter()
  };

  constructor(readonly baseUrl: string) {
  }
  getAllTokenPairs(): Promise<(readonly [Token, Token])[]> {
    throw new Error('Method not implemented.');
  }

  getSwapOperations(): Promise<SwapOperation[]> {
    throw new Error('Method not implemented.');
  }
}
