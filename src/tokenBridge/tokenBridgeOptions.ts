import type { EtherlinkBridgeBlockchainService, TezosBridgeBlockchainService } from '../bridgeBlockchainService';
import type {
  TokensBridgeDataProvider,
  BalancesBridgeDataProvider,
  TransfersBridgeDataProvider
} from '../bridgeDataProviders';

interface DataProvidersTokenBridgeOptions {
  tokens: TokensBridgeDataProvider;
  balances: BalancesBridgeDataProvider;
  transfers: TransfersBridgeDataProvider
}

export interface TokenBridgeOptions<
  TTezosBridgeBlockchainService extends TezosBridgeBlockchainService = TezosBridgeBlockchainService,
  TEtherlinkBridgeBlockchainService extends EtherlinkBridgeBlockchainService = EtherlinkBridgeBlockchainService
> {
  tezosBridgeBlockchainService: TTezosBridgeBlockchainService;
  etherlinkBridgeBlockchainService: TEtherlinkBridgeBlockchainService;
  bridgeDataProviders: DataProvidersTokenBridgeOptions;
}
