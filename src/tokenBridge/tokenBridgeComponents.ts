import type { BalancesBridgeDataProvider, TokensBridgeDataProvider, TransfersBridgeDataProvider } from '../bridgeDataProviders';
import type { EtherlinkBlockchainBridgeComponent } from '../etherlink';
import type { TezosBlockchainBridgeComponent } from '../tezos';

export interface TokenBridgeComponents {
  readonly tezos: TezosBlockchainBridgeComponent;
  readonly etherlink: EtherlinkBlockchainBridgeComponent;
  readonly balancesBridgeDataProvider: BalancesBridgeDataProvider;
  readonly tokensBridgeDataProvider: TokensBridgeDataProvider;
  readonly transfersBridgeDataProvider: TransfersBridgeDataProvider;
}
