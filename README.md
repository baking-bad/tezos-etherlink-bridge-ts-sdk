# Etherlink Token Bridge TypeScript SDK

> ⚠️ Please note: This SDK is actively being developed, and its API may undergo changes. ⚠️

This is [TypeScript](https://www.typescriptlang.org/) SDK designed for building **token bridge applications** between [Tezos](https://tezos.com/) (L1) and [Etherlink](https://www.etherlink.com/) (L2).

## Getting Started

### Prerequisites
* [Node.js](https://nodejs.org) version 20.10.0 or later  
* [npm](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm)

The SDK communicates with blockchains using popular libraries:
* [Taquito](https://tezostaquito.io/) for Tezos
* [Web3.js](https://web3js.org/) for Etherlink

These packages are defined as `peerDependencies`, so users of the SDK must install and configure them in their applications themselves.

### Installation
```sh
npm install @baking-bad/tezos-etherlink-bridge-ts-sdk
```

### Prepare the Blockchain Toolkits

The SDK requires instances of the `TezosToolkit` and `Web3`. These instances must be able to sign data and transactions. Depending on the type of application, there are two approaches:

**For dApps using end-user wallets:**  
Taquito also requires the [@taquito/beacon-wallet](https://www.npmjs.com/package/@taquito/beacon-wallet) package for dApps to use end-user wallets.  
Web3 can use the global provider via the `window` instance.  
Example configuration:

```ts
import { BeaconWallet } from '@taquito/beacon-wallet';
import { TezosToolkit } from '@taquito/taquito';
import Web3 from 'web3';

// Create and configure the toolkit for Tezos
const tezosRpcUrl = 'https://rpc.tzkt.io/nairobinet';
const tezosToolkit = new TezosToolkit(tezosRpcUrl);
const beaconWallet = new BeaconWallet({
  name: 'Your dApp name',
  network: { type: 'custom', rpcUrl: tezosRpcUrl }
});
tezosToolkit.setWalletProvider(beaconWallet);

// Create and configure the toolkit for Etherlink
const web3 = new Web3(window.ethereum);
```

**For dApps use custom signers**  

> TODO

### SDK Usage

The SDK only allows registered (listed) tokens to be transferred between Tezos and Etherlink. ([see details](https://github.com/baking-bad/etherlink-bridge?tab=readme-ov-file#bridge-configuration-listing-new-token-pairs)). 
Configure a list of token pairs or the corresponding provider:  

```ts
import type { FA12TezosToken, ERC20EtherlinkToken, TokenPair } from '@baking-bad/tezos-etherlink-bridge-ts-sdk';

// ...

const ctezTezosToken: FA12TezosToken = {
  type: 'fa1.2',
  address: 'KT1GM2AnBAJWdzrChp3hTYFTSb6Dmh61peBP'
};
const ctezEtherlinkToken: ERC20EtherlinkToken = {
  type: 'erc20',
  address: '0x8554cd57c0c3e5ab9d1782c9063279fa9bfa4680'
};

const tokenPairs: TokenPair[] = [
  {
    tezos: {
      ...ctezTezosToken,
      ticketerContractAddress: 'KT1PmYUomF3HDxsGWYQUCbLi2X8WvT7ZHv8o',
      tickerHelperContractAddress: 'KT1TZg9EwGHKbfWvsHGsqBjm3J5NhJBtHPKX'
    },
    etherlink: ctezEtherlinkToken
  }
];
```

Once token pairs are configured, creating an instance of `TokenBridge` is a type through which you can deposit, withdraw tokens, and receive token transfers between layers. There two approaches to create the `TokenBridge` instance.

The first one is to use the `createDefaultTokenBridge` method, which creates an instance with default options and DipDup, which is the balance and transfer data provider:  

```ts
import { createDefaultTokenBridge } from '@baking-bad/tezos-etherlink-bridge-ts-sdk';

// ...

const tokenBridge = createDefaultTokenBridge({
  tezos: {
    toolkit: tezosToolkit,
    rollupAddress: 'sr1QgYF6ARMSLcWyAX4wFDrWFaZTyy4twbqe'
  },
  etherlink: {
    toolkit: web3
  },
  tokenPairs,
  dipDup: {
    baseUrl: 'https://etherlink-indexer.dipdup.net/'
  }
});
```

The second approach is to create an instance directly (`new TokenBridge(<options>)`) and configure all options and data providers manually:

```ts
import {
  TokenBridge, LocalTokensBridgeDataProvider, DipDupBridgeDataProvider,
  defaultEtherlinkKernelAddress, defaultEtherlinkWithdrawPrecompileAddress
} from '@baking-bad/tezos-etherlink-bridge-ts-sdk';

// ...

const dipDup = new DipDupBridgeDataProvider({
  baseUrl: 'https://etherlink-indexer.dipdup.net/',
  autoUpdate: 'websocket'
});
const tokenBridge = new TokenBridge({
  tezos: {
    toolkit: tezosToolkit,
    bridgeOptions: {
      rollupAddress: 'sr1QgYF6ARMSLcWyAX4wFDrWFaZTyy4twbqe'
    }
  },
  etherlink: {
    toolkit: web3,
    bridgeOptions: {
      kernelAddress: defaultEtherlinkKernelAddress,
      withdrawPrecompileAddress: defaultEtherlinkWithdrawPrecompileAddress
    }
  },
  bridgeDataProviders: {
    tokens: new LocalTokensBridgeDataProvider(tokenPairs),
    balances: dipDup,
    transfers: dipDup
  }
});
```

Start the TokenBridge instance to receive real-time updates of user transfers, use caching and other internal mechanisms:

```ts
// ...
await tokenBridge.start();
```

<details>
<summary><b>The entire code</b></summary>

```ts
import {
  type FA12TezosToken, type ERC20EtherlinkToken, type TokenPair,
  createDefaultTokenBridge
} from '@baking-bad/tezos-etherlink-bridge-ts-sdk';

// ...

// Creating and configurating tezosToolkit and web3 

// ...

const ctezTezosToken: FA12TezosToken = {
  type: 'fa1.2',
  address: 'KT1GM2AnBAJWdzrChp3hTYFTSb6Dmh61peBP'
};
const ctezEtherlinkToken: ERC20EtherlinkToken = {
  type: 'erc20',
  address: '0x8554cd57c0c3e5ab9d1782c9063279fa9bfa4680'
};
const tokenPairs: TokenPair[] = [
  {
    tezos: {
      ...ctezTezosToken,
      ticketerContractAddress: 'KT1PmYUomF3HDxsGWYQUCbLi2X8WvT7ZHv8o',
      tickerHelperContractAddress: 'KT1TZg9EwGHKbfWvsHGsqBjm3J5NhJBtHPKX'
    },
    etherlink: ctezEtherlinkToken
  }
];

const tokenBridge = createDefaultTokenBridge({
  tezos: {
    toolkit: tezosToolkit,
    rollupAddress: 'sr1QgYF6ARMSLcWyAX4wFDrWFaZTyy4twbqe'
  },
  etherlink: {
    toolkit: web3
  },
  tokenPairs,
  dipDup: {
    baseUrl: 'https://etherlink-indexer.dipdup.net/'
  }
});

await tokenBridge.start();
```

</details>

Your application is ready to deposit/withdraw user tokens and receive their corresponding transfers.

## Transfer tokens

There are two type of token transfers:  
1. **Deposit**. This is a token transfer from Tezos (L1) to Etherlink (L2). The transfer required only one action of end-user Tezos wallet.
2. **Withdrawal**. This is a token transfer from Etherlink (L2) to Tezos (L1). The transfer happens in two stages:  
    1. Call the `withdraw` method of the Etherlink kernel. (Web3 wallet interaction);
    2. Call the outbox message of Tezos rollup when the corresponding commitments will be cemented. (Tezos wallet interaction).

### Deposit

To deposit tokens, use the asynchronous `TokenBridge.deposit` method, passing Tezos token and amount in raw type (not divided by token decimals). The method returns a bridge transfer with `BridgeTokenTransferKind.Deposit` type and `BridgeTokenTransferStatus.Pending` status, along with the Taquito object of the corresponding Tezos operation.

The Deposit transfer has the following statuses(`BridgeTokenTransferStatus`):

1. Pending (Code: 0)
2. Created (Code: 1)
3. Finished (Code: 3)
4. Failed (Code: 4)

Use the asynchronous `TokenBridge.waitBridgeTokenTransferStatus` method to wait until the specified token transfer reaches the specified status.

> ℹ️ The SDK automatically adds token approval operations. However, if needed, you can disable this feature by passing the set option flag: `useApprove: false`.

```ts
import type { FA12TezosToken } from '@baking-bad/tezos-etherlink-bridge-ts-sdk';

// ...
// const tokenBridge: TokenBridge = ...
// ...

const ctezTezosToken: FA12TezosToken = {
  type: 'fa1.2',
  address: 'KT1GM2AnBAJWdzrChp3hTYFTSb6Dmh61peBP'
};
// Deposit 1 Ctez to Etherlink (L2)
const depositResult = await tokenBridge.deposit(ctezTezosToken, 1_000_000n);
const depositTransfer = depositResult.tokenTransfer;
console.log(`
  The ${depositTransfer.tezosOperation.source} start to deposit ${depositTransfer.tezosOperation.amount} ${depositTransfer.tezosOperation.token.address} [${depositTransfer.tezosOperation.token.type}] tokens to Etherlink.

  Transfer Kind: ${BridgeTokenTransferKind[depositTransfer.kind]}
  Transfer Status: ${BridgeTokenTransferStatus[depositTransfer.status]}
  Tezos Operation Hash: ${depositTransfer.tezosOperation.hash}
  Tezos Operation Timestamp: ${depositTransfer.tezosOperation.timestamp}
`);

// Wait until the deposit status is Finished
const finishedBridgeTokenDeposit = await tokenBridge.waitBridgeTokenTransferStatus(
  depositTransfer,
  BridgeTokenTransferStatus.Finished
);
console.log(`
  The ${finishedBridgeTokenDeposit.tezosOperation.source} deposited ${finishedBridgeTokenDeposit.tezosOperation.amount} ${finishedBridgeTokenDeposit.tezosOperation.token.address} [${finishedBridgeTokenDeposit.tezosOperation.token.type}] tokens to Etherlink as ${finishedBridgeTokenDeposit.etherlinkOperation.token.address} [${finishedBridgeTokenDeposit.etherlinkOperation.token.type}] token.

  Transfer Kind: ${BridgeTokenTransferKind[finishedBridgeTokenDeposit.kind]}
  Transfer Status: ${BridgeTokenTransferStatus[finishedBridgeTokenDeposit.status]}
  Tezos Operation Hash: ${finishedBridgeTokenDeposit.tezosOperation.hash}
  Tezos Operation Timestamp: ${finishedBridgeTokenDeposit.tezosOperation.timestamp}
  Etherlink Operation Hash: ${finishedBridgeTokenDeposit.etherlinkOperation.hash}
  Etherlink Operation Timestamp: ${finishedBridgeTokenDeposit.etherlinkOperation.timestamp}
`);

// Done!

```

Also, you can use the `tokenTransferUpdated` event to receive the actual status of token transfers in real-time:

```ts
import type { FA12TezosToken } from '@baking-bad/tezos-etherlink-bridge-ts-sdk';

// ...
// const tokenBridge: TokenBridge = ...
// ...

const ctezTezosToken: FA12TezosToken = {
  type: 'fa1.2',
  address: 'KT1GM2AnBAJWdzrChp3hTYFTSb6Dmh61peBP'
};

tokenBridge.transfersBridgeDataProvider.events.tokenTransferUpdated.addListener(
  tokenTransfer => {
    if (tokenTransfer.kind === BridgeTokenTransferKind.Deposit && tokenTransfer.status === BridgeTokenTransferStatus.Finished) {
      console.log(`
  The ${finishedBridgeTokenDeposit.tezosOperation.source} deposited ${finishedBridgeTokenDeposit.tezosOperation.amount} ${finishedBridgeTokenDeposit.tezosOperation.token.address} [${finishedBridgeTokenDeposit.tezosOperation.token.type}] tokens to Etherlink as ${finishedBridgeTokenDeposit.etherlinkOperation.token.address} [${finishedBridgeTokenDeposit.etherlinkOperation.token.type}] token.

  Transfer Kind: ${BridgeTokenTransferKind[finishedBridgeTokenDeposit.kind]}
  Transfer Status: ${BridgeTokenTransferStatus[finishedBridgeTokenDeposit.status]}
  Tezos Operation Hash: ${finishedBridgeTokenDeposit.tezosOperation.hash}
  Tezos Operation Timestamp: ${finishedBridgeTokenDeposit.tezosOperation.timestamp}
  Etherlink Operation Hash: ${finishedBridgeTokenDeposit.etherlinkOperation.hash}
  Etherlink Operation Timestamp: ${finishedBridgeTokenDeposit.etherlinkOperation.timestamp}
`);

    }
  }
);

// Deposit 1 Ctez to Etherlink (L2)
const depositResult = await tokenBridge.deposit(ctezTezosToken, 1_000_000n);
const depositTransfer = depositResult.tokenTransfer;
console.log(`
  The ${depositTransfer.tezosOperation.source} start to deposit ${depositTransfer.tezosOperation.amount} ${depositTransfer.tezosOperation.token.address} [${depositTransfer.tezosOperation.token.type}] tokens to Etherlink.

  Transfer Kind: ${BridgeTokenTransferKind[depositTransfer.kind]}
  Transfer Status: ${BridgeTokenTransferStatus[depositTransfer.status]}
  Tezos Operation Hash: ${depositTransfer.tezosOperation.hash}
  Tezos Operation Timestamp: ${depositTransfer.tezosOperation.timestamp}
`);
```

By default, the receiver address on Etherlink (L2) is the address of the connected account in Web3. If you need to deposit tokens to a custom Etherlink address, you can pass this address as the third parameter:

```ts
// ...

const etherlinkReceiverAddress = '0x...';
const depositResult = await tokenBridge.deposit(ctezTezosToken, 1_000_000n, etherlinkReceiverAddress);

// ...
```

### Withdraw

The tokens withdrawal process consists of two stages. Use the asynchronous `TokenBridge.startWithdraw` and `TokenBridge.finishWithdraw` methods.

To start withdraw, call `TokenBridge.startWithdraw` method, passing Etherlink token and amount in raw type (not divided by token decimals).  The method returns a bridge transfer with `BridgeTokenTransferKind.Withdrawal` type and `BridgeTokenTransferStatus.Pending` status, along with the Web3 object of the corresponding Etherlink operation.

The Withdrawal transfer has the following statuses (`BridgeTokenTransferStatus`):

1. Pending (Code: 0)
2. Created (Code: 1)
3. Sealed (Code: 2)
4. Finished (Code: 3)
5. Failed (Code: 4)

You can you the asynchronous `TokenBridge.waitBridgeTokenTransferStatus` method to waiting when the specified token transfer will be has specified status.
Use the asynchronous `TokenBridge.waitBridgeTokenTransferStatus` method to wait until the specified token transfer reaches the specified status.

```ts
import type { ERC20EtherlinkToken } from '@baking-bad/tezos-etherlink-bridge-ts-sdk';

// ...
// const tokenBridge: TokenBridge = ...
// ...

const ctezEtherlinkToken: ERC20EtherlinkToken = {
  type: 'erc20',
  address: '0x8554cd57c0c3e5ab9d1782c9063279fa9bfa4680'
};
// Withdraw 1 Ctez from Etherlink (L2)
// The first stage
const startWithdrawResult = await tokenBridge.startWithdraw(ctezEtherlinkToken, 1_000_000n);
const withdrawalTransfer = startWithdrawResult.tokenTransfer;
console.log(`
  The ${withdrawalTransfer.etherlinkOperation.source} start to withdraw ${withdrawalTransfer.etherlinkOperation.amount} ${withdrawalTransfer.etherlinkOperation.token.address} [${withdrawalTransfer.etherlinkOperation.token.type}] tokens from Etherlink.

  Transfer Kind: ${BridgeTokenTransferKind[withdrawalTransfer.kind]}
  Transfer Status: ${BridgeTokenTransferStatus[withdrawalTransfer.status]}
  Etherlink Operation Hash: ${withdrawalTransfer.etherlinkOperation.hash}
  Etherlink Operation Timestamp: ${withdrawalTransfer.etherlinkOperation.timestamp}
`);

// Wait until the withdrawal status is Sealed
const sealedBridgeTokenWithdrawal = await tokenBridge.waitBridgeTokenTransferStatus(
  withdrawalTransfer,
  BridgeTokenTransferStatus.Sealed
);
console.log(`
  The ${sealedBridgeTokenWithdrawal.etherlinkOperation.source} completed the first stage of the ${sealedBridgeTokenWithdrawal.etherlinkOperation.amount} ${sealedBridgeTokenWithdrawal.etherlinkOperation.token.address} [${sealedBridgeTokenWithdrawal.etherlinkOperation.token.type}] tokens withdrawal.

  Transfer Kind: ${BridgeTokenTransferKind[sealedBridgeTokenWithdrawal.kind]}
  Transfer Status: ${BridgeTokenTransferStatus[sealedBridgeTokenWithdrawal.status]}
  Etherlink Operation Hash: ${sealedBridgeTokenWithdrawal.etherlinkOperation.hash}
  Etherlink Operation Timestamp: ${sealedBridgeTokenWithdrawal.etherlinkOperation.timestamp}
  Tezos Rollup Commitment: ${sealedBridgeTokenWithdrawal.rollupData.commitment}
  Tezos Rollup Proof: ${sealedBridgeTokenWithdrawal.rollupData.proof}
`);

// The second stage
const finishWithdrawResult = await tokenBridge.finishWithdraw(sealedBridgeTokenWithdrawal);
// Wait until the withdrawal status is Finished
const finishedBridgeTokenWithdrawal = await tokenBridge.waitBridgeTokenTransferStatus(
  finishWithdrawResult.tokenTransfer,
  BridgeTokenTransferStatus.Finished
);
console.log(`
  The ${finishedBridgeTokenWithdrawal.etherlinkOperation.source} withdrew ${finishedBridgeTokenWithdrawal.etherlinkOperation.amount} ${finishedBridgeTokenWithdrawal.etherlinkOperation.token.address} [${finishedBridgeTokenWithdrawal.etherlinkOperation.token.type}] tokens from Etherlink to Tezos as ${finishedBridgeTokenWithdrawal.tezosOperation.token.address} [${finishedBridgeTokenWithdrawal.tezosOperation.token.type}] token.

  Transfer Kind: ${BridgeTokenTransferKind[finishedBridgeTokenWithdrawal.kind]}
  Transfer Status: ${BridgeTokenTransferStatus[finishedBridgeTokenWithdrawal.status]}
  Etherlink Operation Hash: ${finishedBridgeTokenWithdrawal.etherlinkOperation.hash}
  Etherlink Operation Timestamp: ${finishedBridgeTokenWithdrawal.etherlinkOperation.timestamp}
  Tezos Operation Hash: ${finishedBridgeTokenWithdrawal.tezosOperation.hash}
  Tezos Operation Timestamp: ${finishedBridgeTokenWithdrawal.tezosOperation.timestamp}
  Tezos Rollup Commitment: ${finishedBridgeTokenWithdrawal.rollupData.commitment}
  Tezos Rollup Proof: ${finishedBridgeTokenWithdrawal.rollupData.proof}
`);

// Done!

```

Also, you can use the `tokenTransferUpdated` event to receive actual status of token transfers in real-time.

### Use data providers

To make token transfers, the SDK requires actual blockchain data, and it uses data providers for this purpose. There are the following types of data providers:
1. `TransfersBridgeDataProvider` provides token transfers by requested addresses and operation hashes. Monitors for new transfers and updates, emitting corresponding events.  
**Default provider:** `DipDupBridgeDataProvider`.  

2. `BalancesBridgeDataProvider` helps to receive actual token balances in Tezos and Etherlink blockchains.  
**Default provider:** `DipDupBridgeDataProvider`.  

3. `TokensBridgeDataProvider` is required for the SDK to receive the listed token pairs.  
**Default provider:** `LocalTokensBridgeDataProvider`, which receives an array of listed token pairs upon creation.

**TransfersBridgeDataProvider**

Use this provider to receive token transfers.
To get token transfers where the sender (in the case of deposit) or receiver (in the case of withdrawal) is the specified address/addresses, use the `getTokenTransfers` method.

```ts
// ...
// const tokenBridge: TokenBridge = ...
// ...

let tokenTransfers = tokenBridge.transfersBridgeDataProvider.getTokenTransfers(['tz1...']);
tokenTransfers = tokenBridge.transfersBridgeDataProvider.getTokenTransfers(['tz1...', '0x...']);
tokenTransfers = tokenBridge.transfersBridgeDataProvider.getTokenTransfers(['tz1...', 'tz1...', '0x...']);
```

The method has an overload with offset/limit parameters to specify how many entries you want to load.

```ts
// ...
// const tokenBridge: TokenBridge = ...
// ...

// Load 100 entries
let tokenTransfers = tokenBridge.transfersBridgeDataProvider.getTokenTransfers(['tz1...', '0x...'], 0, 100);
// skip the first 300 entries and load 50
tokenTransfers = tokenBridge.transfersBridgeDataProvider.getTokenTransfers(['tz1...', '0x...'], 300, 50);
```

If you need to find the transfer by Tezos or Etherlink operation hash, use the `getTokenTransfer` method.

```ts
// ...
// const tokenBridge: TokenBridge = ...
// ...

let tokenTransfer = tokenBridge.transfersBridgeDataProvider.getTokenTransfer('op...');
tokenTransfer = tokenBridge.transfersBridgeDataProvider.getTokenTransfer('0x...');
```

## Advanced usage

### Deposit with additional operations

If you need to perform operations before or after deposit operations in the same batch, pass such operations to the `TokenBridge.deposit` method:

```ts
import { OpKind, type WalletParamsWithKind } from '@taquito/taquito';
import type { FA12TezosToken } from '@baking-bad/tezos-etherlink-bridge-ts-sdk';

// ...
// const tokenBridge: TokenBridge = ...
// ...

const ctezTezosToken: FA12TezosToken = {
  type: 'fa1.2',
  address: 'KT1GM2AnBAJWdzrChp3hTYFTSb6Dmh61peBP'
};
// Deposit 1 Ctez to Etherlink (L2)
const beforeCalls: WalletParamsWithKind[] = [
  {
    kind: OpKind.TRANSACTION,
    amount: 1000,
    to: 'tz1...',
  }
];
const afterCalls: WalletParamsWithKind[] = [
  {
    kind: OpKind.TRANSACTION,
    amount: 3000,
    to: 'tz1...',
  }
];
const depositResult = await tokenBridge.deposit(ctezTezosToken, 1_000_000n, {
  beforeCalls,
  afterCalls
});
```
In this case, the batch operation will consist of:
1. Operations of the `beforeCalls` array;
2. Deposit operations with approving token;
3. Operations of the `afterCalls` array.

### Select a type of Taquito API

The Taquito has two API types:
1. [Contract API](https://tezostaquito.io/docs/operation_flow#contract-api)
2. [Wallet API](https://tezostaquito.io/docs/operation_flow#wallet-api)

[Contract API vs Wallet API](https://tezostaquito.io/docs/wallet_API#choosing-between-the-contract-api-and-the-wallet-api)

By default, the SDK uses the Wallet API for signing and sending operations. However, you can specify that the SDK should use the Contract API by passing a special flag to methods that work with Tezos operations.
Example:  

```ts
import type { FA12TezosToken } from '@baking-bad/tezos-etherlink-bridge-ts-sdk';

// ...
// const tokenBridge: TokenBridge = ...
// ...

const walletDepositResult = await tokenBridge.deposit(ctezTezosToken, 1_000_000n);
// depositResult.depositOperation is the BatchWalletOperation type
const contractDepositResult = await tokenBridge.deposit(ctezTezosToken, 1_000_000n, {
  useWalletApi: false
});
// depositResult.depositOperation is the BatchOperation type
```

### Create own data providers
> TODO: Insert a link of demo data provider
