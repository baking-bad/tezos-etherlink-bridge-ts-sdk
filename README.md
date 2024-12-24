# Etherlink Token Bridge TypeScript/JavaScript SDK

[![NPM Version](https://img.shields.io/npm/v/%40baking-bad%2Ftezos-etherlink-bridge-sdk?color=59ad8c)](https://www.npmjs.com/package/@baking-bad/tezos-etherlink-bridge-sdk)
[![License](https://img.shields.io/npm/l/%40baking-bad%2Ftezos-etherlink-bridge-sdk?color=59ad8c)](https://github.com/baking-bad/tezos-etherlink-bridge-ts-sdk/blob/master/LICENSE)
![Isomorphic](https://img.shields.io/badge/type-isomorphic-59ad8c)
[![Github Actions](https://github.com/baking-bad/tezos-etherlink-bridge-ts-sdk/actions/workflows/tezos-etherlink-bridge-sdk.yml/badge.svg)](https://github.com/baking-bad/tezos-etherlink-bridge-ts-sdk/actions/workflows/tezos-etherlink-bridge-sdk.yml)

[Next.js Demo - Application](https://urchin-app-vpgut.ondigitalocean.app/bridge)&nbsp;&nbsp;•&nbsp;
[Next.js Demo - Repository](https://github.com/skubarenko/tezos-etherlink-bridge-ts-sdk-demo)

This [TypeScript](https://www.typescriptlang.org/) SDK is designed for building **token bridge applications** between [Tezos](https://tezos.com/) (L1) and [Etherlink](https://www.etherlink.com/) (L2). It allows developers to easily:
* Deposit native (XTZ) and FA tokens from Tezos to Etherlink.
* Withdraw native and ERC20 tokens from Etherlink back to Tezos.
* Retrieve information on all token transfers (deposits and withdrawals) or by operation/transaction hash, or addresses.
* Receive actual token balances for specific addresses.
* Obtain real-time updates on existing or new token transfers for specific addresses or all transfers.

The SDK is isomorphic, enabling developers to create bridge applications on the frontend using popular frameworks or Vanilla JavaScript, as well as on the server-side using Node.js.

## Getting Started

### Prerequisites
* [Node.js](https://nodejs.org) version 20.10.0 or later
* [npm](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm) or [Yarn](https://yarnpkg.com/)

### Installation

1. Install the SDK package:

    ```sh
    npm install @baking-bad/tezos-etherlink-bridge-sdk
    ```
    or
    ```sh
    yarn add @baking-bad/tezos-etherlink-bridge-sdk
    ```

2. Install additional dependencies:

    The SDK requires additional libraries for interacting with the blockchains. These packages are marked as optional `peerDependencies`, so depending on your preference, you also need to install and configure the appropriate package for each blockchain manually in your application.

    **Tezos**
    * [Taquito](https://tezostaquito.io). The SDK supports both the [Wallet API](https://tezostaquito.io/docs/operation_flow#wallet-api) and [Contract API](https://tezostaquito.io/docs/operation_flow#contract-api):

        * The Wallet API. If your application needs to interact with wallets using the [Beacon SDK](https://www.walletbeacon.io)

            ```sh
            npm install @taquito/taquito @taquito/beacon-wallet
            ```
            or
            ```sh
            yarn add @taquito/taquito @taquito/beacon-wallet
            ```

        * Contract API.

            ```sh
            npm install @taquito/taquito
            ```
            or
            ```sh
            yarn add @taquito/taquito
            ```

    **Etherlink**. Choose one of these packages for interfacing with the Etherlink blockchain, depending on your preference. You only need one of these packages, not both.

    * [Web3.js](https://web3js.org).

        ```sh
        npm install web3
        ```
        or
        ```
        yarn add web3
        ```

    * [Ethers.js](https://github.com/ethers-io/ethers.js).

        ```sh
        npm install ethers
        ```
        or
        ```sh
        yarn add ethers
        ```

3. Install [ws](https://github.com/websockets/ws) for Node.js applications (optional):

    If you are developing a Node.js application, you also need to install the [ws](https://www.npmjs.com/package/ws) package as Node.js doesn't have a native WebSocket implementation.
    ```sh
    npm install ws
    ```
    or
    ```sh
    yarn add ws
    ```

### Configure the Blockchain libraries

Depending on the blockchain libraries you choose to use, you will need to configure them to sign data and transactions.

#### Taquito - Wallet API
```ts
import { BeaconWallet } from '@taquito/beacon-wallet';
import { TezosToolkit } from '@taquito/taquito';

const tezosRpcUrl = 'https://rpc.tzkt.io/ghostnet';
const tezosToolkit = new TezosToolkit(tezosRpcUrl);
const beaconWallet = new BeaconWallet({
  name: 'Your dApp name',
  network: { type: 'custom', rpcUrl: tezosRpcUrl }
});
tezosToolkit.setWalletProvider(beaconWallet);
```

#### Taquito - Contract API
```ts
import { InMemorySigner } from '@taquito/signer';
import { TezosToolkit } from '@taquito/taquito';

const tezosRpcUrl = 'https://rpc.tzkt.io/ghostnet';
const tezosToolkit = new TezosToolkit(tezosRpcUrl);
const signer = new InMemorySigner('<your secret key>');
tezosToolkit.setSignerProvider(signer);
```

#### Web3.js
```ts
import Web3 from 'web3';

// Use MetaMask
const web3 = new Web3(window.ethereum);
```

#### Ethers.js
```ts
import { ethers } from 'ethers';

// Use MetaMask
const provider = new ethers.BrowserProvider(window.ethereum)
const signer = await provider.getSigner();
```

### Configure the SDK

The SDK only allows registered (listed) tokens to be transferred between Tezos and Etherlink ([see details](https://github.com/baking-bad/etherlink-bridge?tab=readme-ov-file#bridge-configuration-listing-new-token-pairs)).
Configure a list of token pairs or the corresponding provider:

<details>
<summary><b>Example token pair configuration code</b></summary>

```ts
import type { TokenPair } from '@baking-bad/tezos-etherlink-bridge-sdk';

// ...

const tokenPairs: TokenPair[] = [
  // Native
  {
    tezos: {
      type: 'native',
      ticketHelperContractAddress: 'KT1VEjeQfDBSfpDH5WeBM5LukHPGM2htYEh3',
    },
    etherlink: {
      type: 'native',
    }
  },
  // tzBTC
  {
    tezos: {
      type: 'fa1.2',
      address: 'KT1HmyazXfKDbo8XjwtWPXcoyHcmNPDCvZyb',
      ticketerContractAddress: 'KT1H7if3gSZE1pZSK48W3NzGpKmbWyBxWDHe',
      ticketHelperContractAddress: 'KT1KUAaaRMeMS5TJJyGTQJANcpSR4egvHBUk',
    },
    etherlink: {
      type: 'erc20',
      address: '0x8e73aE3CF688Fbd8368c99520d26F9eF1B4d3BCa',
    }
  },
  // USDt
  {
    tezos: {
      type: 'fa2',
      address: 'KT1V2ak1MfNd3w4oyKD64ehYU7K4CrpUcDGR',
      tokenId: '0',
      ticketerContractAddress: 'KT1S6Nf9MnafAgSUWLKcsySPNFLUxxqSkQCw',
      ticketHelperContractAddress: 'KT1JLZe4qTa76y6Us2aDoRNUgZyssSDUr6F5',
    },
    etherlink: {
      type: 'erc20',
      address: '0xf68997eCC03751cb99B5B36712B213f11342452b',
    }
  }
];
```

</details>

Once token pairs are configured, creating an instance of `TokenBridge` is a type through which you can deposit, withdraw tokens, and receive token transfers between layers.

```ts
import {
  DefaultDataProvider,
  TokenBridge,
  TaquitoWalletTezosBridgeBlockchainService,
  Web3EtherlinkBridgeBlockchainService,
} from '@baking-bad/tezos-etherlink-bridge-sdk';

// ...
const defaultDataProvider = new DefaultDataProvider({
  tokenPairs,
  dipDup: {
    baseUrl: 'https://testnet.bridge.indexer.etherlink.com',
    webSocketApiBaseUrl: 'wss://testnet.bridge.indexer.etherlink.com'
  },
  tzKTApiBaseUrl: 'https://api.ghostnet.tzkt.io',
  etherlinkRpcUrl: 'https://node.ghostnet.etherlink.com',
})

const tokenBridge = new TokenBridge({
  tezosBridgeBlockchainService: new TaquitoWalletTezosBridgeBlockchainService({
    tezosToolkit,
    smartRollupAddress: 'sr18wx6ezkeRjt1SZSeZ2UQzQN3Uc3YLMLqg'
  }),
  etherlinkBridgeBlockchainService: new Web3EtherlinkBridgeBlockchainService({
    web3
  }),
  // or for ethers
  // etherlinkBridgeBlockchainService: new EthersEtherlinkBridgeBlockchainService({
  //   ethers,
  //   signer
  // }),
  bridgeDataProviders: {
    transfers: defaultDataProvider,
    balances: defaultDataProvider,
    tokens: defaultDataProvider,
  }
});
```

<details>
<summary><b>The entire code</b></summary>

```ts
import {
  DefaultDataProvider,
  TokenBridge,
  TaquitoWalletTezosBridgeBlockchainService,
  Web3EtherlinkBridgeBlockchainService,
  type TokenPair
} from '@baking-bad/tezos-etherlink-bridge-sdk';

// ...

const tokenPairs: TokenPair[] = [
  // Native
  {
    tezos: {
      type: 'native',
      ticketHelperContractAddress: 'KT1VEjeQfDBSfpDH5WeBM5LukHPGM2htYEh3',
    },
    etherlink: {
      type: 'native',
    }
  },
  // tzBTC
  {
    tezos: {
      type: 'fa1.2',
      address: 'KT1HmyazXfKDbo8XjwtWPXcoyHcmNPDCvZyb',
      ticketerContractAddress: 'KT1H7if3gSZE1pZSK48W3NzGpKmbWyBxWDHe',
      ticketHelperContractAddress: 'KT1KUAaaRMeMS5TJJyGTQJANcpSR4egvHBUk',
    },
    etherlink: {
      type: 'erc20',
      address: '0x8e73aE3CF688Fbd8368c99520d26F9eF1B4d3BCa',
    }
  },
  // USDt
  {
    tezos: {
      type: 'fa2',
      address: 'KT1V2ak1MfNd3w4oyKD64ehYU7K4CrpUcDGR',
      tokenId: '0',
      ticketerContractAddress: 'KT1S6Nf9MnafAgSUWLKcsySPNFLUxxqSkQCw',
      ticketHelperContractAddress: 'KT1JLZe4qTa76y6Us2aDoRNUgZyssSDUr6F5',
    },
    etherlink: {
      type: 'erc20',
      address: '0xf68997eCC03751cb99B5B36712B213f11342452b',
    }
  }
];

const defaultDataProvider = new DefaultDataProvider({
  dipDup: {
    baseUrl: 'https://testnet.bridge.indexer.etherlink.com',
    webSocketApiBaseUrl: 'wss://testnet.bridge.indexer.etherlink.com'
  },
  tzKTApiBaseUrl: 'https://api.ghostnet.tzkt.io',
  etherlinkRpcUrl: 'https://node.ghostnet.etherlink.com',
  tokenPairs
})

const tokenBridge = new TokenBridge({
  tezosBridgeBlockchainService: new TaquitoWalletTezosBridgeBlockchainService({
    tezosToolkit: tezosToolkit,
    smartRollupAddress: 'sr18wx6ezkeRjt1SZSeZ2UQzQN3Uc3YLMLqg'
  }),
  etherlinkBridgeBlockchainService: new Web3EtherlinkBridgeBlockchainService({
    web3
  }),
  bridgeDataProviders: {
    transfers: defaultDataProvider,
    balances: defaultDataProvider,
    tokens: defaultDataProvider,
  }
});
```

</details>

Your application is ready to deposit/withdraw user tokens and receive their corresponding transfers.

## Transfer tokens

There are two types of token transfers:
1. **Deposit**: This is a token transfer from Tezos (L1) to Etherlink (L2). The transfer requires only one operation in Tezos.
2. **Withdrawal**: This is a token transfer from Etherlink (L2) to Tezos (L1). The transfer occurs in two stages:
    1. Call the `withdraw` method of the Etherlink kernel (sending a transaction in Etherlink).
    2. Call the outbox message of Tezos rollup when the corresponding commitment is cemented (sending an operation in Tezos).

### Deposit

To deposit tokens, use the asynchronous `TokenBridge.deposit` method, passing the amount in raw type (not divided by token decimals) and the Tezos token.
The method returns an object that includes two fields:
* `tokenTransfer`: Represents the bridge transfer with `BridgeTokenTransferKind.Deposit` type and `BridgeTokenTransferStatus.Pending` status.
* `operationResult`: An operation object in the format compatible with the chosen Tezos Blockchain Component, representing the Tezos operation for the deposit.

```ts
import { BridgeTokenTransferStatus, type FA12TezosToken } from '@baking-bad/tezos-etherlink-bridge-sdk';

// ...
// const tokenBridge: TokenBridge = ...
// ...

const tzbtcTezosToken: FA12TezosToken = {
  type: 'fa1.2',
  address: 'KT1HmyazXfKDbo8XjwtWPXcoyHcmNPDCvZyb',
};

// Deposit 0.01 tzBTC (8 decimals) to Etherlink (L2)
const { tokenTransfer, operationResult } = await tokenBridge.deposit(1_000_000n, tzbtcTezosToken);
console.dir(tokenTransfer, { depth: null });
```

The Deposit transfer has the following statuses (`BridgeTokenTransferStatus`):

1. Pending [Code: 0]: The deposit operation has been sent to the Tezos blockchain but not confirmed yet.
2. Created [Code: 100]: The deposit operation has been confirmed on Tezos.
3. Finished [Code: 300]: The Etherlink transaction has been created and confirmed, successfully completing the deposit.
4. Failed [Code: 400]: The deposit failed for any reason.

After initiating a deposit by sending a Tezos operation, you need a way to track its progress and completion. The SDK offers two approaches:

1. Stream API and Events. [See details](#stream-api-and-events).
2. Using the asynchronous `TokenBridge.waitForStatus` method. This method allows you to wait until the specified token transfer reaches the specified status or a higher one.
This method subscribes to real-time updates for the specified token transfer. Once the transfer reaches the specified status (`BridgeTokenTransferStatus`) or a higher one, the method unsubscribes and returns a resolved promise containing the updated token transfer:

    ```ts
    import { BridgeTokenTransferStatus, type FA12TezosToken } from '@baking-bad/tezos-etherlink-bridge-sdk';

    // ...
    // const tokenBridge: TokenBridge = ...
    // ...

    const tzbtcTezosToken: FA12TezosToken = {
      type: 'fa1.2',
      address: 'KT1HmyazXfKDbo8XjwtWPXcoyHcmNPDCvZyb',
    };

    // Deposit 0.01 tzBTC (8 decimals) to Etherlink (L2)
    const { tokenTransfer, operationResult } = await tokenBridge.deposit(1_000_000n, tzbtcTezosToken);
    console.dir(tokenTransfer, { depth: null });

    // Wait until the deposit status is Finished
    const finishedBridgeTokenDeposit = await tokenBridge.waitForStatus(
      tokenTransfer,
      BridgeTokenTransferStatus.Finished
    );
    console.dir(finishedBridgeTokenDeposit, { depth: null });
    ```

By default, the `deposit` method uses the signer's address from the Etherlink Blockchain Component as the recipient address on the Etherlink (L2) blockchain. However, you can specify a custom recipient address for the deposit by passing it as the third argument to the `deposit` method:

```ts
// ...

const etherlinkReceiverAddress = '0x...';
const { tokenTransfer, operationResult } = await tokenBridge.deposit(1_000_000n, tzbtcTezosToken, etherlinkReceiverAddress);
```

Additionally, the SDK automatically adds token approval operations. However, if needed, you can disable this feature by passing the `useApprove: false` option flag:

```ts
await tokenBridge.deposit(amount, token, { useApprove: false });
// or
await tokenBridge.deposit(amount, token, etherlinkReceiverAddress, { useApprove: false });
```

The SDK also automatically resets token approval for FA1.2 tokens by adding an additional operation with approve **0** amount. If you don't need this behavior, you can disable it by passing the `resetFA12Approve: false` option flag:

```ts
await tokenBridge.deposit(amount, token, { resetFA12Approve: false });
// or
await tokenBridge.deposit(amount, token, etherlinkReceiverAddress, { resetFA12Approve: false });
```

### Withdraw
The withdrawal process involves two stages: initiating the withdrawal on the Etherlink (L2) blockchain and completing it on the Tezos (L1) blockchain.

1. Initiating Withdrawal (Etherlink, L2):
    To start withdrawing tokens, call the asynchronous `TokenBridge.startWithdraw` method, passing the amount in raw type (not divided by token decimals) and the Etherlink token.
    The method returns an object that includes two fields:
    * `tokenTransfer`: Represents the bridge transfer with `BridgeTokenTransferKind.Withdrawal` type and `BridgeTokenTransferStatus.Pending` status.
    * `operationResult`: An operation object in the format compatible with the chosen Etherlink Blockchain Component, representing the Etherlink transaction for the withdrawal.

    ```ts
    import { BridgeTokenTransferStatus, type ERC20EtherlinkToken } from '@baking-bad/tezos-etherlink-bridge-sdk';

    // ...
    // const tokenBridge: TokenBridge = ...
    // ...

    const tzbtcEtherlinkToken: ERC20EtherlinkToken = {
      type: 'erc20',
      address: '0x8e73aE3CF688Fbd8368c99520d26F9eF1B4d3BCa'
    };
    // Withdraw 0.01 tzBTC (8 decimals) from Etherlink (L2)
    // The first stage
    const { tokenTransfer, operationResult } = await tokenBridge.startWithdraw(1_000_000n, tzbtcEtherlinkToken);
    console.dir(tokenTransfer, { depth: null });
    ```

2. Completing Withdrawal (Tezos, L1):
    Once the corresponding commitment in Tezos is cemented, the token transfer status will change to `BridgeTokenTransferStatus.Sealed`. At this stage, the transfer will include additional rollup data (`commitment` and `proof`) needed for completion.

    To complete the withdrawal, call the asynchronous `TokenBridge.finishWithdraw` method, passing the transfer with `BridgeTokenTransferStatus.Sealed` status.
    The method returns an object that includes two fields:
    * `tokenTransfer`: Represents the bridge transfer with `BridgeTokenTransferKind.Withdrawal` type and `BridgeTokenTransferStatus.Sealed` status.
    * `operationResult`: An operation object in the format compatible with the chosen Tezos Blockchain Component, representing the Tezos operation for the execution of smart rollup outbox message.

    ```ts
    const sealedBridgeTokenWithdrawal: SealedBridgeTokenWithdrawal = // ...
    const { tokenTransfer, operationResult } = await tokenBridge.finishWithdraw(sealedBridgeTokenWithdrawal);
    ```

The Withdrawal transfer has the following statuses (`BridgeTokenTransferStatus`):

1. Pending [Code: 0]: The withdrawal transaction has been sent to the Etherlink blockchain but not confirmed yet.
2. Created [Code: 100]: The withdrawal transaction has been confirmed on Etherlink.
3. Sealed [Code: 200]: The withdrawal is ready for the second stage: the corresponding commitment is cemented, and an outbox message is ready for execution.
4. Finished [Code: 300]: The Tezos transaction for executing the outbox message has been created and confirmed, successfully completing the withdrawal.
5. Failed [Code: 400]: The withdrawal process failed for any reason.

Similar to deposits, the SDK offers two approaches to track the withdrawal progress:

1. Stream API and Events. [See details](#stream-api-and-events).
2. Using the asynchronous `TokenBridge.waitForStatus` method. This method allows you to wait until the specified token transfer reaches the specified status or a higher one.
This method subscribes to real-time updates for the specified token transfer. Once the transfer reaches the specified status (`BridgeTokenTransferStatus`) or a higher one, the method unsubscribes and returns a resolved promise containing the updated token transfer:

    ```ts
    import { BridgeTokenTransferStatus, type ERC20EtherlinkToken } from '@baking-bad/tezos-etherlink-bridge-sdk';

    // ...
    // const tokenBridge: TokenBridge = ...
    // ...

    const tzbtcEtherlinkToken: ERC20EtherlinkToken = {
      type: 'erc20',
      address: '0x8e73aE3CF688Fbd8368c99520d26F9eF1B4d3BCa'
    };
    // Withdraw 0.01 tzBTC (8 decimals) from Etherlink (L2)
    // The first stage
    const { tokenTransfer, operationResult } = await tokenBridge.startWithdraw(1_000_000n, tzbtcEtherlinkToken);
    console.dir(tokenTransfer, { depth: null });

    // Wait until the withdrawal status is Sealed
    const sealedBridgeTokenWithdrawal = await tokenBridge.waitForStatus(
      tokenTransfer,
      BridgeTokenTransferStatus.Sealed
    );
    console.dir(sealedBridgeTokenWithdrawal, { depth: null });

    // The second stage
    const finishWithdrawResult = await tokenBridge.finishWithdraw(sealedBridgeTokenWithdrawal);
    // Wait until the withdrawal status is Finished
    const finishedBridgeTokenWithdrawal = await tokenBridge.waitForStatus(
      finishWithdrawResult.tokenTransfer,
      BridgeTokenTransferStatus.Finished
    );
    console.dir(finishedBridgeTokenWithdrawal, { depth: null });
    ```

## Stream API and Events

The SDK offers the Stream API (accessed through `TokenBridge.stream`) for subscribing to real-time updates on token transfers. You can track token transfers and react to them accordingly using the following events:
* `tokenTransferCreated`. This event is triggered when a new token transfer is:
    * Created locally within your application (initiated through `TokenBridge.deposit` or `TokenBridge.startWithdraw`).
    * Discovered by the data provider (indicating a new transfer on the bridge).

    > ℹ️ This event **does not** directly correlate with the `BridgeTokenTransferStatus.Created` status. The `tokenTransferCreated` event can be emitted for token transfers with any status. For example, the event can be emitted for a non-local deposit with the `BridgeTokenTransferStatus.Finished` status when the deposit can be completed immediately.
* `tokenTransferUpdated`. This event is triggered whenever an existing token transfer is updated.

```ts
// ...
// const tokenBridge: TokenBridge = ...
// ...

tokenBridge.addEventListener('tokenTransferCreated', tokenTransfer => {
  console.log('A new token transfer has been created:');
  console.dir(tokenTransfer, { depth: null });
});

tokenBridge.addEventListener('tokenTransferUpdated', tokenTransfer => {
  console.log('A token transfer has been updated:');
  console.dir(tokenTransfer, { depth: null });
});
```

### Track a specific token transfer operation

The `TokenBridge.stream.subscribeToOperationTokenTransfers` method allows you to subscribe to real-time updates of a specific token transfer by providing its token transfer object or operation/transaction hash:

* By token transfer object:
    ```ts
    const tokenTransfer: BridgeTokenTransfer = // ...
    tokenBridge.stream.subscribeToOperationTokenTransfers(tokenTransfer);
    ```

* By operation/transaction hash:
    ```ts
    // Subscribe to token transfer by Tezos operation hash
    tokenBridge.stream.subscribeToOperationTokenTransfers('o...');
    // Subscribe to token transfer by Etherlink transaction hash
    tokenBridge.stream.subscribeToOperationTokenTransfers('0x...');
    ```

When you no longer need to track a specific token transfer operation, you can unsubscribe from it using the `TokenBridge.stream.unsubscribeFromOperationTokenTransfers` method with the same parameters used for subscribing with `TokenBridge.stream.subscribeToOperationTokenTransfers`. This ensures that your application doesn't continue to receive updates for that particular token transfer once it's no longer needed.

The `TokenBridge.stream.subscribeToOperationTokenTransfers` method is useful when you need to update the data of a specific token transfer in different parts of your code,  such as within the UI or other components.

```ts
import { BridgeTokenTransferStatus, type BridgeTokenTransfer } from '@baking-bad/tezos-etherlink-bridge-sdk';

// ...
// const tokenBridge: TokenBridge = ...
// ...

const handleTokenTransferUpdated = (tokenTransfer: BridgeTokenTransfer) => {
  console.dir(tokenTransfer, { depth: null });

  if (tokenTransfer.status === BridgeTokenTransferStatus.Finished) {
    // If the token transfer is finished, unsubscribe from it as we no longer need to track it
    tokenBridge.stream.unsubscribeFromOperationTokenTransfers(tokenTransfer);
  }
};

tokenBridge.addEventListener('tokenTransferCreated', handleTokenTransferUpdated);
tokenBridge.addEventListener('tokenTransferUpdated', handleTokenTransferUpdated);

// ...

const { tokenTransfer } = await tokenBridge.deposit(300_000n, { type: 'fa1.2', address: 'KT1HmyazXfKDbo8XjwtWPXcoyHcmNPDCvZyb' });
tokenBridge.stream.subscribeToOperationTokenTransfers(tokenTransfer);
```

### Track token transfers of specific addresses

```ts
import type { BridgeTokenTransfer } from '@baking-bad/tezos-etherlink-bridge-sdk';

// ...
// const tokenBridge: TokenBridge = ...
// ...

const handleTokenTransferCreated = (tokenTransfer: BridgeTokenTransfer) => {
  console.log('A new token transfer has been created:');
  console.dir(tokenTransfer, { depth: null });
};
const handleTokenTransferUpdated = (tokenTransfer: BridgeTokenTransfer) => {
  console.log('A token transfer has been updated:');
  console.dir(tokenTransfer, { depth: null });
};

tokenBridge.addEventListener('tokenTransferCreated', handleTokenTransferCreated);
tokenBridge.addEventListener('tokenTransferUpdated', handleTokenTransferUpdated);

tokenBridge.stream.subscribeToAccountTokenTransfers(['tz1...', '0x...']);
```

### Track all bridge token transfers

```ts
import type { BridgeTokenTransfer } from '@baking-bad/tezos-etherlink-bridge-sdk';

// ...
// const tokenBridge: TokenBridge = ...
// ...

const handleTokenTransferCreated = (tokenTransfer: BridgeTokenTransfer) => {
  console.log('A new token transfer has been created:');
  console.dir(tokenTransfer, { depth: null });
};
const handleTokenTransferUpdated = (tokenTransfer: BridgeTokenTransfer) => {
  console.log('A token transfer has been updated:');
  console.dir(tokenTransfer, { depth: null });
};

tokenBridge.addEventListener('tokenTransferCreated', handleTokenTransferCreated);
tokenBridge.addEventListener('tokenTransferUpdated', handleTokenTransferUpdated);

tokenBridge.stream.subscribeToTokenTransfers();
```

### Unsubscribe from all subscriptions

```ts
// ...
// const tokenBridge: TokenBridge = ...
// ...

tokenBridge.stream.unsubscribeFromAllSubscriptions();
```

## Data API

With the SDK, you can access useful data such as token transfers and token balances.

### Token Transfers

To receive all token transfers over the Etherlink bridge:
```ts
// ...
// const tokenBridge: TokenBridge = ...
// ...

const tokenTransfers = await tokenBridge.data.getTokenTransfers();
```

Since the number of token transfers can be large, use the `offset` and `limit` parameters to specify the number of entries you want to load:
```ts
// ...
// const tokenBridge: TokenBridge = ...
// ...

// Load last 100 token transfers
const tokenTransfers = await tokenBridge.data.getTokenTransfers({ offset: 0, limit: 100 });
```

To receive token transfers for specific accounts:
```ts
// ...
// const tokenBridge: TokenBridge = ...
// ...

let tokenTransfers = await tokenBridge.data.getAccountTokenTransfers('tz1...');
tokenTransfers = await tokenBridge.data.getAccountTokenTransfers(['tz1...', '0x...']);
tokenTransfers = await tokenBridge.data.getAccountTokenTransfers(['tz1...', 'tz1...', '0x...']);
```

You can also use the `offset` and `limit` parameters to specify the number of entries you want to load:
```ts
// ...
// const tokenBridge: TokenBridge = ...
// ...

// Load last 100 token transfers
let tokenTransfers = await tokenBridge.data.getAccountTokenTransfers(['tz1...', '0x...'], { offset: 0, limit: 100 });
// skip the last 300 token transfers and load 50
tokenTransfers = await tokenBridge.data.getAccountTokenTransfers(['tz1...', '0x...'], { offset: 300, limit: 50 });
```

To find a transfer by Tezos or Etherlink operation hash, use the `getOperationTokenTransfers` method:
```ts
// ...
// const tokenBridge: TokenBridge = ...
// ...

let tokenTransfers = await tokenBridge.data.getOperationTokenTransfers('o...');
tokenTransfers = await tokenBridge.data.getOperationTokenTransfers('0x...');
```
