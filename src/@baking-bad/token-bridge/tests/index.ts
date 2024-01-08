import * as dotenv from 'dotenv';

import { createTezosToolkitWithSigner } from './createTezosToolkitWithSigner';
import { createWeb3ToolkitWithSigner } from './createWeb3ToolkitWithSigner';
import { testFa12Deposit } from './depositFa12';
import { testFa2Deposit } from './depositFa2';
import { withdrawFa12 } from './withdrawFa12';
import { withdrawFa2 } from './withdrawFa2';

(async () => {
  dotenv.config();

  const rollupAddress = 'sr1FLVPpwyYeQptyaUpmbkevMWTdU3PL6XFF';

  const l1RpcUrl = 'https://rpc.tzkt.io/nairobinet';
  const l1ExecutorKey = process.env.L1_EXECUTOR_PRIVATE_KEY as string;
  const tezosToolkit = createTezosToolkitWithSigner(l1ExecutorKey, l1RpcUrl);

  const l2RpcUrl = 'https://etherlink.dipdup.net';
  const l2ExecutorKey = process.env.L2_EXECUTOR_PRIVATE_KEY as string;
  const web3Toolkit = createWeb3ToolkitWithSigner(l2ExecutorKey, l2RpcUrl);

  await testFa12Deposit(tezosToolkit, rollupAddress);
  await testFa2Deposit(tezosToolkit, rollupAddress);
  await withdrawFa12(web3Toolkit, tezosToolkit);
  await withdrawFa2(web3Toolkit, tezosToolkit);
})();
