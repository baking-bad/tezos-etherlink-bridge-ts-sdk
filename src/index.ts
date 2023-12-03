import BigNumber from 'bignumber.js';

import { DipDupIndexerBridgeDataProvider, EtherlinkBlockchain, TezosBlockchain, TokenBridge } from './@baking-bad/token-bridge';

(async () => {
  const dipDupIndexer = new DipDupIndexerBridgeDataProvider('<dipdup url>');
  const tokenBridge = new TokenBridge({
    network: 'mainnet',
    blockchain1: new TezosBlockchain({
      rpcUrl: 'https://rpc.tzkt.io/mainnet/',
      getTicketer: token => dipDupIndexer.getTezosTokenTicketer(token)
    }),
    blockchain2: new EtherlinkBlockchain({
      rpcUrl: 'https://node.mainnet.etherlink.com'
    }),
    bridgeDataProvider: dipDupIndexer
  });

  const userSwapOperations = tokenBridge.bridgeDataProvider.getSwapOperations(['tz1...', '0x...']);
  console.log(userSwapOperations);

  tokenBridge.bridgeDataProvider.events.swapOperationUpdated.addListener(
    swapOperationUpdate => {
      // Update 
      console.log(swapOperationUpdate);
    }
  );

  const swapResult = await tokenBridge.swap({ address: 'KT1XnTn74bUtxHfDtBmm2bGZAQfhPbvKWR8o' }, new BigNumber(10), true);
  if (swapResult.success) {
    swapResult.token1;
  }
  else {
    console.error(swapResult.error);
    await tokenBridge.revertFailedSwap(swapResult);
  }
})();
