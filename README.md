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
npm install @baking-bad/tezos-etherlink-bridge-sdk
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

The SDK only allows registered (listed) tokens to be transferred between Tezos and Etherlink ([see details](https://github.com/baking-bad/etherlink-bridge?tab=readme-ov-file#bridge-configuration-listing-new-token-pairs)). 
Configure a list of token pairs or the corresponding provider:  

<details>
<summary><b>Code of the token pairs configurtaion</b></summary>

```ts
import type { FA12TezosToken, FA2TezosToken, ERC20EtherlinkToken, TokenPair } from '@baking-bad/tezos-etherlink-bridge-sdk';

// ...

const ctezTezosToken: FA12TezosToken = {
  type: 'fa1.2',
  address: 'KT1GM2AnBAJWdzrChp3hTYFTSb6Dmh61peBP'
};
const ctezEtherlinkToken: ERC20EtherlinkToken = {
  type: 'erc20',
  address: '0x8554cd57c0c3e5ab9d1782c9063279fa9bfa4680'
};

const fxhashTezosToken: FA2TezosToken = {
  type: 'fa2',
  address: 'KT1GemMPvp2bV8TUV1DzWTwdhT27TtMgJiTw',
  tokenId: '42'
};
const fxhashEtherlinkToken: ERC20EtherlinkToken = {
  type: 'erc20',
  address: '0xcB5d40c6B1bdf5Cd51b3801351b0A68D101a561b'
};

const tokenPairs: TokenPair[] = [
  {
    tezos: {
      token: { type: 'native' },
      ticketerContractAddress: 'KT1XsAj9z2DX2LLrq6bTRJBDubrME2auietW',
    },
    etherlink: {
      token: { type: 'native' }
    }
  },
  {
    tezos: {
      token: ctezTezosToken,
      ticketerContractAddress: 'KT1PmYUomF3HDxsGWYQUCbLi2X8WvT7ZHv8o',
      tickerHelperContractAddress: 'KT1TZg9EwGHKbfWvsHGsqBjm3J5NhJBtHPKX'
    },
    etherlink: {
      token: ctezEtherlinkToken
    }
  },
  {
    tezos: {
      token: fxhashTezosToken,
      ticketerContractAddress: 'KT1GQEybCQffb6YJ5NH9GhPEeRyufrYP3amN',
      tickerHelperContractAddress: 'KT1LstLU529PtDUQHo2x8WybNXBzLXnF6Tkv'
    },
    etherlink: {
      token: fxhashEtherlinkToken
    }
  }
];
```

</details>  


Once token pairs are configured, creating an instance of `TokenBridge` is a type through which you can deposit, withdraw tokens, and receive token transfers between layers. There two approaches to create the `TokenBridge` instance.

The first one is to use the `createDefaultTokenBridge` method, which creates an instance with default options and DipDup, which is the balance and transfer data provider:  

```ts
import { createDefaultTokenBridge } from '@baking-bad/tezos-etherlink-bridge-sdk';

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
    baseUrl: 'https://etherlink-indexer.dipdup.net',
    autoUpdate: {
      type: 'websocket',
      webSocketApiBaseUrl: 'wss://etherlink-indexer.dipdup.net'
    }
  }
});
```

The second approach is to create an instance directly (`new TokenBridge(<options>)`) and configure all options and data providers manually:

```ts
import {
  TokenBridge, LocalTokensBridgeDataProvider, DipDupBridgeDataProvider,
  defaultEtherlinkKernelAddress, defaultEtherlinkWithdrawPrecompileAddress
} from '@baking-bad/tezos-etherlink-bridge-sdk';

// ...

const dipDup = new DipDupBridgeDataProvider({
  baseUrl: 'https://etherlink-indexer.dipdup.net/',
  autoUpdate: {
    type: 'websocket',
    webSocketApiBaseUrl: 'wss://etherlink-indexer.dipdup.net'
  }
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
Start the TokenBridge instance to set up a websocket connection for future real-time updates of user transfers, initiate caching, and enable other internal mechanisms:

```ts
// ...
await tokenBridge.start();
```

<details>
<summary><b>The entire code</b></summary>

```ts
import {
  type FA12TezosToken, type FA2TezosToken, type ERC20EtherlinkToken, type TokenPair,
  createDefaultTokenBridge
} from '@baking-bad/tezos-etherlink-bridge-sdk';

const ctezTezosToken: FA12TezosToken = {
  type: 'fa1.2',
  address: 'KT1GM2AnBAJWdzrChp3hTYFTSb6Dmh61peBP'
};
const ctezEtherlinkToken: ERC20EtherlinkToken = {
  type: 'erc20',
  address: '0x8554cd57c0c3e5ab9d1782c9063279fa9bfa4680'
};

const fxhashTezosToken: FA2TezosToken = {
  type: 'fa2',
  address: 'KT1GemMPvp2bV8TUV1DzWTwdhT27TtMgJiTw',
  tokenId: '42'
};
const fxhashEtherlinkToken: ERC20EtherlinkToken = {
  type: 'erc20',
  address: '0xcB5d40c6B1bdf5Cd51b3801351b0A68D101a561b'
};

const tokenPairs: TokenPair[] = [
  {
    tezos: {
      token: { type: 'native' },
      ticketerContractAddress: 'KT1XsAj9z2DX2LLrq6bTRJBDubrME2auietW',
    },
    etherlink: {
      token: { type: 'native' }
    }
  },
  {
    tezos: {
      token: ctezTezosToken,
      ticketerContractAddress: 'KT1PmYUomF3HDxsGWYQUCbLi2X8WvT7ZHv8o',
      tickerHelperContractAddress: 'KT1TZg9EwGHKbfWvsHGsqBjm3J5NhJBtHPKX'
    },
    etherlink: {
      token: ctezEtherlinkToken
    }
  },
  {
    tezos: {
      token: fxhashTezosToken,
      ticketerContractAddress: 'KT1GQEybCQffb6YJ5NH9GhPEeRyufrYP3amN',
      tickerHelperContractAddress: 'KT1LstLU529PtDUQHo2x8WybNXBzLXnF6Tkv'
    },
    etherlink: {
      token: fxhashEtherlinkToken
    }
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
    baseUrl: 'https://etherlink-indexer.dipdup.net',
    autoUpdate: {
      type: 'websocket',
      webSocketApiBaseUrl: 'wss://etherlink-indexer.dipdup.net'
    }
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

To deposit tokens, use the asynchronous `TokenBridge.deposit` method, passing amount in raw type (not divided by token decimals) and Tezos token. The method returns a bridge transfer with `BridgeTokenTransferKind.Deposit` type and `BridgeTokenTransferStatus.Pending` status, along with the Taquito object of the corresponding Tezos operation.

The Deposit transfer has the following statuses(`BridgeTokenTransferStatus`):

1. Pending (Code: 0)
2. Created (Code: 100)
3. Finished (Code: 300)
4. Failed (Code: 400)

Use the asynchronous `TokenBridge.waitForBridgeTokenTransferStatus` method to wait until the specified token transfer reaches the specified status. 

> ℹ️ This `TokenBridge.waitForBridgeTokenTransferStatus` method subscribes to real-time updates of the specified token transfer. Consequently, you may receive updates through the `TokenBridge.events.tokenTransferUpdated` event if it is utilized.

> ℹ️ The SDK automatically adds token approval operations. However, if needed, you can disable this feature by passing the set option flag: `useApprove: false`.

```ts
import { BridgeTokenTransferStatus, type FA12TezosToken } from '@baking-bad/tezos-etherlink-bridge-sdk';

// ...
// const tokenBridge: TokenBridge = ...
// ...

const ctezTezosToken: FA12TezosToken = {
  type: 'fa1.2',
  address: 'KT1GM2AnBAJWdzrChp3hTYFTSb6Dmh61peBP'
};
// Deposit 1 Ctez to Etherlink (L2)
const depositResult = await tokenBridge.deposit(1_000_000n, ctezTezosToken);
console.dir(depositResult.tokenTransfer, { depth: null });

// Wait until the deposit status is Finished
const finishedBridgeTokenDeposit = await tokenBridge.waitForBridgeTokenTransferStatus(
  depositResult.tokenTransfer,
  BridgeTokenTransferStatus.Finished
);
console.dir(finishedBridgeTokenDeposit, { depth: null });

// Done!

```

Additionally, you have the option to manually subscribe to token transfers and utilize the `TokenBridge.events.tokenTransferUpdated` event to receive real-time updates on the current status of subscribed token transfers:

```ts
import { BridgeTokenTransferStatus, type FA12TezosToken } from '@baking-bad/tezos-etherlink-bridge-sdk';

// ...
// const tokenBridge: TokenBridge = ...
// ...

const ctezTezosToken: FA12TezosToken = {
  type: 'fa1.2',
  address: 'KT1GM2AnBAJWdzrChp3hTYFTSb6Dmh61peBP'
};

tokenBridge.events.tokenTransferUpdated.addListener(tokenTransfer => {
  console.dir(tokenTransfer, { depth: null });

  if (tokenTransfer.status === BridgeTokenTransferStatus.Finished) {
    // Unsubscribe from the token transfer as the transfer is finished and there is no need to use the subscription
    tokenBridge.unsubscribeFromTokenTransfer(tokenTransfer);
  }
});

// Deposit 1 Ctez to Etherlink (L2)
const depositResult = await tokenBridge.deposit(1_000_000n, ctezTezosToken);
console.dir(depositResult.tokenTransfer, { depth: null });

tokenBridge.subscribeToTokenTransfer(depositResult.tokenTransfer);
```

By default, the receiver address on Etherlink (L2) is the address of the connected account in Web3. If you need to deposit tokens to a custom Etherlink address, you can pass this address as the third parameter:

```ts
// ...

const etherlinkReceiverAddress = '0x...';
const depositResult = await tokenBridge.deposit(1_000_000n, ctezTezosToken, etherlinkReceiverAddress);

// ...
```

### Withdraw

The tokens withdrawal process consists of two stages. Use the asynchronous `TokenBridge.startWithdraw` and `TokenBridge.finishWithdraw` methods.

To start withdraw, call `TokenBridge.startWithdraw` method, passing amount in raw type (not divided by token decimals) and Etherlink token. The method returns a bridge transfer with `BridgeTokenTransferKind.Withdrawal` type and `BridgeTokenTransferStatus.Pending` status, along with the Web3 object of the corresponding Etherlink operation.

The Withdrawal transfer has the following statuses (`BridgeTokenTransferStatus`):

1. Pending (Code: 0)
2. Created (Code: 100)
3. Sealed (Code: 200)
4. Finished (Code: 300)
5. Failed (Code: 400)

Use the asynchronous `TokenBridge.waitForBridgeTokenTransferStatus` method to wait until the specified token transfer reaches the specified status. 

> ℹ️ This `TokenBridge.waitForBridgeTokenTransferStatus` method subscribes to real-time updates of the specified token transfer. Consequently, you may receive updates through the `TokenBridge.events.tokenTransferUpdated` event if it is utilized.

```ts
import { BridgeTokenTransferStatus, type ERC20EtherlinkToken } from '@baking-bad/tezos-etherlink-bridge-sdk';

// ...
// const tokenBridge: TokenBridge = ...
// ...

const ctezEtherlinkToken: ERC20EtherlinkToken = {
  type: 'erc20',
  address: '0x8554cd57c0c3e5ab9d1782c9063279fa9bfa4680'
};
// Withdraw 1 Ctez from Etherlink (L2)
// The first stage
const startWithdrawResult = await tokenBridge.startWithdraw(1_000_000n, ctezEtherlinkToken);
console.dir(startWithdrawResult.tokenTransfer, { depth: null });

// Wait until the withdrawal status is Sealed
const sealedBridgeTokenWithdrawal = await tokenBridge.waitForBridgeTokenTransferStatus(
  startWithdrawResult.tokenTransfer,
  BridgeTokenTransferStatus.Sealed
);
console.dir(sealedBridgeTokenWithdrawal, { depth: null });

// The second stage
const finishWithdrawResult = await tokenBridge.finishWithdraw(sealedBridgeTokenWithdrawal);
// Wait until the withdrawal status is Finished
const finishedBridgeTokenWithdrawal = await tokenBridge.waitForBridgeTokenTransferStatus(
  finishWithdrawResult.tokenTransfer,
  BridgeTokenTransferStatus.Finished
);
console.dir(finishedBridgeTokenWithdrawal, { depth: null });

// Done!

```

Additionally, you have the option to manually subscribe to token transfers and utilize the `TokenBridge.events.tokenTransferUpdated` event to receive real-time updates on the current status of subscribed token transfers:

### Subscriptions and Events

To receive real-time updates of token transfers, use the `TokenBridge.subscribeToTokenTransfer` method and `TokenBridge.events`:
1. `tokenTransferCreated` emits when a new token transfer is created;
2. `tokenTransferUpdated` emits when the data of an existing token transfer is updated.

```ts
// ...
// const tokenBridge: TokenBridge = ...
// const tokenTransfer: BridgeTokenTransfer =
// ...

tokenBridge.events.tokenTransferCreated.addListener(
  tokenTransfer => {
    console.log('Created a new token transfer:');
    console.dir(tokenTransfer, { depth: null });
  }
);

tokenBridge.events.tokenTransferUpdated.addListener(
  tokenTransfer => {
    console.log('Token transfer is updated:');
    console.dir(tokenTransfer, { depth: null });
  }
);

tokenBridge.subscribeToTokenTransfer(tokenTransfer);
// Subscribe to token transfers by operation hash
// Tezos operation
tokenBridge.subscribeToTokenTransfer('o...');
// Etherlink transaction
tokenBridge.subscribeToTokenTransfer('0x...');
```

### Data

With the SDK, you can access useful data such as token transfers and token balances.

**Token Transfers**

To receive all token transfers over the Etherlink bridge:
```ts
// ...
// const tokenBridge: TokenBridge = ...
// ...

const tokenTransfers = tokenBridge.data.getTokenTransfers();
```

Since the number of token transfers can be large, use the `offset` and `limit` parameters to specify the number of entries you want to load:
```ts
// ...
// const tokenBridge: TokenBridge = ...
// ...

// Load last 100 token transfers
let tokenTransfers = tokenBridge.data.getTokenTransfers(0, 100);
```

To receive token transfers for specific accounts:
```ts
// ...
// const tokenBridge: TokenBridge = ...
// ...

let tokenTransfers = tokenBridge.data.getTokenTransfers(['tz1...']);
tokenTransfers = tokenBridge.data.getTokenTransfers(['tz1...', '0x...']);
tokenTransfers = tokenBridge.data.getTokenTransfers(['tz1...', 'tz1...', '0x...']);
```

You can also use the `offset` and `limit` parameters to specify the number of entries you want to load:
```ts
// ...
// const tokenBridge: TokenBridge = ...
// ...

// Load last 100 token transfers
let tokenTransfers = tokenBridge.data.getTokenTransfers(['tz1...', '0x...'], 0, 100);
// skip the last 300 token transfers and load 50
tokenTransfers = tokenBridge.data.getTokenTransfers(['tz1...', '0x...'], 300, 50);
```

To find a transfer by Tezos or Etherlink operation hash, use the `getTokenTransfer` method:
```ts
// ...
// const tokenBridge: TokenBridge = ...
// ...

let tokenTransfer = tokenBridge.data.getTokenTransfer('o...');
tokenTransfer = tokenBridge.data.getTokenTransfer('0x...');
```

## Advanced usage

### Select a type of Taquito API

The Taquito has two API types:
1. [Contract API](https://tezostaquito.io/docs/operation_flow#contract-api)
2. [Wallet API](https://tezostaquito.io/docs/operation_flow#wallet-api)

[Contract API vs Wallet API](https://tezostaquito.io/docs/wallet_API#choosing-between-the-contract-api-and-the-wallet-api)

By default, the SDK uses the Wallet API for signing and sending operations. However, you can specify that the SDK should use the Contract API by passing a special flag to methods that work with Tezos operations.
Example:  

```ts
import type { FA12TezosToken } from '@baking-bad/tezos-etherlink-bridge-sdk';

// ...
// const tokenBridge: TokenBridge = ...
// ...

const walletDepositResult = await tokenBridge.deposit(1_000_000n, ctezTezosToken);
// depositResult.depositOperation is the BatchWalletOperation type
const contractDepositResult = await tokenBridge.deposit(1_000_000n, ctezTezosToken, {
  useWalletApi: false
});
// depositResult.depositOperation is the BatchOperation type
```

### Create own data providers

To make token transfers, the SDK requires actual blockchain data, and it uses data providers for this purpose. There are the following types of data providers:
1. `TransfersBridgeDataProvider` provides token transfers by requested addresses and operation hashes. Monitors for new transfers and updates, emitting corresponding events.  
**Default provider:** `DipDupBridgeDataProvider`.  

2. `BalancesBridgeDataProvider` helps to receive actual token balances in Tezos and Etherlink blockchains.  
**Default provider:** `DipDupBridgeDataProvider`.  

3. `TokensBridgeDataProvider` is required for the SDK to receive the listed token pairs.  
**Default provider:** `LocalTokensBridgeDataProvider`, which receives an array of listed token pairs upon creation.

> TODO: Insert a link of demo data provider
