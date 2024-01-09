import type { BridgeTokenTransfer } from '../bridgeOperations';
import type { EtherlinkToken } from '../etherlink/tokens';
import type { TezosToken } from '../tezos';

export interface TokenPair {
  tezos: {
    token: TezosToken;
    ticketerContractAddress: string;
    tickerHelperContractAddress?: string;
  };
  etherlink: {
    token: EtherlinkToken;
  }
}

export interface BridgeDataProvider {
  // events: {
  //   swapOperationUpdated: EventEmitter<readonly [args: any]>
  // }

  getRegisteredTokenPair(token: TezosToken | EtherlinkToken): Promise<TokenPair | null>;
  getRegisteredTokenPairs(): Promise<TokenPair[]>;
  getTokenTransfers(userAddresses: string[]): Promise<BridgeTokenTransfer[]>;
}
