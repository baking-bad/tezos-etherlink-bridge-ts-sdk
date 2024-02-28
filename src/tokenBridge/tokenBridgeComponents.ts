import { EtherlinkBridgeBlockchainService, TezosBridgeBlockchainService } from '../bridgeBlockchainService';
import type { BalancesBridgeDataProvider, TokensBridgeDataProvider, TransfersBridgeDataProvider } from '../bridgeDataProviders';

export interface TokenBridgeComponents<
  TTezosBridgeBlockchainService extends TezosBridgeBlockchainService,
  TEtherlinkBridgeBlockchainService extends EtherlinkBridgeBlockchainService
> {
  readonly tezosBridgeBlockchainService: TTezosBridgeBlockchainService;
  readonly etherlinkBridgeBlockchainService: TEtherlinkBridgeBlockchainService;
  readonly balancesBridgeDataProvider: BalancesBridgeDataProvider;
  readonly tokensBridgeDataProvider: TokensBridgeDataProvider;
  readonly transfersBridgeDataProvider: TransfersBridgeDataProvider;
}
