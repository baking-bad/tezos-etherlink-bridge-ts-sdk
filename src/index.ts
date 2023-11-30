import { DipDupIndexerBridgeDataProvider, EtherlinkBlockchain, TezosBlockchain, TokenBridge } from './@baking-bad/token-bridge';

(async () => {
  const tokenBridge = new TokenBridge({
    network: 'mainnet',
    blockchain1: new TezosBlockchain({
      rpcUrl: 'https://rpc.tzkt.io/mainnet/',
    }),
    blockchain2: new EtherlinkBlockchain({
      rpcUrl: 'https://node.ghostnet.etherlink.com'
    }),
    bridgeDataProvider: new DipDupIndexerBridgeDataProvider('<dipdup url>')
  });

  tokenBridge.bridgeDataProvider.events.swapOperationUpdated.addListener(
    swapOperationUpdate => {
      console.log(swapOperationUpdate);
    }
  );

  const swapResult = await tokenBridge.swap('KT1XnTn74bUtxHfDtBmm2bGZAQfhPbvKWR8o', true);
  if (swapResult.success) {
    swapResult.token1;
  }
  else {
    console.error(swapResult.error);
    await tokenBridge.revertFailedSwap(swapResult);
  }
})();
