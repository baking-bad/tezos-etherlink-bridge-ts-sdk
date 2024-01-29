export interface TokenBridgeService {
  isStarted: boolean;

  start(): Promise<void>;
  stop(): void;
}
