export interface BridgeBlockchainService {
  getSignerAddress(): Promise<string | undefined>;
}
