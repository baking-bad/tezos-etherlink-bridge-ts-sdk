/* eslint-disable no-await-in-loop */
import { validateAddress as validateTezosAddress, ValidationResult } from '@taquito/utils';

import type { MixedIndexerDataProviderOptions } from './mixedIndexerDataProviderOptions';
import { TzktBridgeDataProvider, type TokenPairsProvider } from './providers';
import type { BridgeTokenDeposit, BridgeTokenWithdrawal, BridgeTokenTransfer } from '../../bridgeOperations';
import type { EtherlinkToken } from '../../etherlink';
import type { TezosToken } from '../../tezos';
import type { BridgeDataProvider, TokenPair } from '../bridgeDataProvider';

export class MixedIndexerDataProvider implements BridgeDataProvider {
  protected readonly tokenPairsProvider: TokenPairsProvider;
  protected readonly tzktBridgeDataProvider: TzktBridgeDataProvider;

  constructor(options: MixedIndexerDataProviderOptions) {
    this.tokenPairsProvider = options.registeredTokenPairsProvider;

    this.tzktBridgeDataProvider = new TzktBridgeDataProvider(options.tzktApiBaseUrl);
  }

  async getRegisteredTokenPair(token: TezosToken | EtherlinkToken): Promise<TokenPair | null> {
    return this.tokenPairsProvider.getPair(token);
  }

  async getRegisteredTokenPairs(): Promise<TokenPair[]> {
    return this.tokenPairsProvider.getPairs();
  }

  async getTokenTransfers(userAddresses: string[]): Promise<BridgeTokenTransfer[]> {
    const { tezosAddress, etherlinkAddress } = this.getTezosAndEtherlinkAddresses(userAddresses);
    if (!tezosAddress && !etherlinkAddress)
      return [];

    let tokenTransfers: BridgeTokenTransfer[] = [];
    const tokenPairs = await this.tokenPairsProvider.getPairs();
    // TODO: call methods in parallel
    for (const tokenPair of tokenPairs) {
      if (tezosAddress) {
        tokenTransfers = tokenTransfers.concat(await this.getTezosTokenDeposits(
          tezosAddress,
          tokenPair.tezos.token,
          tokenPair.tezos.ticketerContractAddress
        ));
      }

      if (etherlinkAddress) {
        tokenTransfers = tokenTransfers.concat(await this.getEtherlinkTokenWithdrawals(etherlinkAddress, tokenPair.etherlink.token));
      }
    }

    return tokenTransfers;
  }

  protected async getTezosTokenDeposits(
    userAddress: string,
    token: TezosToken,
    ticketerContractAddress: string
  ): Promise<BridgeTokenDeposit[]> {
    const tokenDepositOperations = await this.tzktBridgeDataProvider.getTezosTokenDeposits(userAddress, token, ticketerContractAddress);

    return tokenDepositOperations;
  }

  protected async getEtherlinkTokenWithdrawals(userAddress: string, token: EtherlinkToken): Promise<BridgeTokenWithdrawal[]> {
    return [];
  }

  protected getTezosAndEtherlinkAddresses(userAddresses: string[]): { tezosAddress?: string, etherlinkAddress?: string } {
    const tezosAddress = userAddresses[0] && validateTezosAddress(userAddresses[0]) === ValidationResult.VALID
      ? userAddresses[0]
      : userAddresses[1];
    const etherlinkAddress = userAddresses[1] && validateTezosAddress(userAddresses[1]) === ValidationResult.VALID
      ? userAddresses[1]
      : userAddresses[0];

    return {
      tezosAddress,
      etherlinkAddress
    };
  }
}
