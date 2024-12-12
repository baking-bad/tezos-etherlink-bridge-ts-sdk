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

    * [Ether.js](https://github.com/ethers-io/ethers.js).

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

#### Ether.js
```ts
import { ethers } from 'ethers';

// Use MetaMask
const provider = new ethers.providers.Web3Provider(window.ethereum);
const signer = provider.getSigner();
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
import { DefaultDataProvider, TokenBridge } from '@baking-bad/tezos-etherlink-bridge-sdk';

// ...
const defaultDataProvider = const defaultDataProvider = new DefaultDataProvider({
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
    tezosToolkit: this.tezosToolkit,
    smartRollupAddress: config.bridge.smartRollupAddress
  }),
  etherlinkBridgeBlockchainService: new Web3EtherlinkBridgeBlockchainService({
    web3
  }),
  // or for ethers
  // etherlinkBridgeBlockchainService: new EthersEtherlinkBridgeBlockchainService({
  //   signer
  // }),
  bridgeDataProviders: {
    transfers: defaultDataProvider,
    balances: defaultDataProvider,
    tokens: defaultDataProvider,
  }
});
```

The second approach is to create an instance directly (`new TokenBridge(<options>)`) and configure all options and data providers manually:

```ts
import {
  TokenBridge, DefaultDataProvider,
  defaultEtherlinkKernelAddress, defaultEtherlinkWithdrawPrecompileAddress
} from '@baking-bad/tezos-etherlink-bridge-sdk';

// ...

const defaultDataProvider = new DefaultDataProvider({
  dipDup: {
    baseUrl: 'https://etherlink-indexer.dipdup.net/',
    webSocketApiBaseUrl: 'wss://etherlink-indexer.dipdup.net'
  },
  tzKTApiBaseUrl: 'https://api.oxfordnet.tzkt.io',
  etherlinkRpcUrl: 'https://etherlink.dipdup.net',
  tokenPairs
});
const tokenBridge = new TokenBridge({
  tezosBridgeBlockchainService: new TaquitoWalletTezosBridgeBlockchainService({
    tezosToolkit: this.tezosToolkit,
    smartRollupAddress: config.bridge.smartRollupAddress
  }),
  etherlinkBridgeBlockchainService: new Web3EtherlinkBridgeBlockchainService({
    web3: this.etherlinkToolkit
  }),
  // or for ethers
  etherlinkBridgeBlockchainService: new EthersEtherlinkBridgeBlockchainService({

  }),
  bridgeDataProviders: {
    transfers: defaultDataProvider,
    balances: defaultDataProvider,
    tokens: defaultDataProvider,
  }
});
```
