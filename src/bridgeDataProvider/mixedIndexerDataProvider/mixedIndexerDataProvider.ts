/* eslint-disable no-await-in-loop */
import { validateAddress as validateTezosAddress, ValidationResult } from '@taquito/utils';

import type { MixedIndexerDataProviderOptions } from './mixedIndexerDataProviderOptions';
import {
  TzktBridgeDataProvider,
  type TokenPairsProvider, BlockscoutBridgeDataProvider
} from './providers';
import type { TokenTransfer } from './providers/blockscoutBridgeDataProvider';
import type { TokenDepositToRollupTzktTransaction } from './providers/tzktBridgeDataProvider';
import {
  BridgeTokenTransferKind, BridgeTokenTransferStatus,
  type BridgeTokenDeposit, type BridgeTokenWithdrawal, type BridgeTokenTransfer
} from '../../bridgeOperations';
import type { EtherlinkToken } from '../../etherlink';
import type { TezosToken } from '../../tezos';
import type { BridgeDataProvider, TokenPair } from '../bridgeDataProvider';

export class MixedIndexerDataProvider implements BridgeDataProvider {
  protected readonly tokenPairsProvider: TokenPairsProvider;
  protected readonly tzktBridgeDataProvider: TzktBridgeDataProvider;
  protected readonly blockscoutBridgeDataProvider: BlockscoutBridgeDataProvider;
  protected readonly tezosRollupAddress: string;
  protected readonly etherlinkKernelAddress: string;
  protected readonly etherlinkWithdrawPrecompileAddress: string;

  constructor(options: MixedIndexerDataProviderOptions) {
    this.tokenPairsProvider = options.registeredTokenPairsProvider;
    this.tezosRollupAddress = options.tezosRollupAddress;
    this.etherlinkKernelAddress = options.etherlinkKernelAddress;
    this.etherlinkWithdrawPrecompileAddress = options.etherlinkWithdrawPrecompileAddress;

    this.tzktBridgeDataProvider = new TzktBridgeDataProvider(options.tzktApiBaseUrl);
    this.blockscoutBridgeDataProvider = new BlockscoutBridgeDataProvider(options.blockscoutBaseUrl);
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

    const tokenPairs = await this.tokenPairsProvider.getPairs();
    const [tokenDeposits, tokenWithdrawals] = await Promise.all([
      tezosAddress ? this.getTokenDepositsInternal(tezosAddress, tokenPairs) : Promise.resolve([]),
      etherlinkAddress ? this.geTokenWithdrawalsInternal(etherlinkAddress, tokenPairs) : Promise.resolve([])
    ]);

    if (!tokenDeposits.length)
      return tokenWithdrawals;

    if (!tokenWithdrawals.length)
      return tokenDeposits;

    const tokenTransfers: BridgeTokenTransfer[] = [];
    let tokenWithdrawalsIndex = 0;

    for (const tokenDeposit of tokenDeposits) {
      const currentTokenWithdrawal = tokenWithdrawals[tokenWithdrawalsIndex];
      if (!currentTokenWithdrawal || tokenDeposit.tezosOperation.timestamp <= currentTokenWithdrawal.etherlinkOperation.timestamp) {
        tokenWithdrawalsIndex++;
        tokenTransfers.push(tokenDeposit);
      }
      else {
        tokenTransfers.push(currentTokenWithdrawal);
      }
    }

    return tokenTransfers;
  }

  async getTokenTransferByOperationHash(operationHash: string): Promise<BridgeTokenTransfer | null> {
    const isWithdrawal = operationHash.startsWith('0x');

    return isWithdrawal
      ? this.getTokenWithdrawalByOperationHash(operationHash)
      : this.getTokenDepositByOperationHash(operationHash);
  }

  async getTokenDeposits(userAddress: string): Promise<BridgeTokenDeposit[]> {
    const tokenPairs = await this.tokenPairsProvider.getPairs();

    return this.getTokenDepositsInternal(userAddress, tokenPairs);
  }

  async getTokenWithdrawals(userAddress: string): Promise<BridgeTokenWithdrawal[]> {
    const tokenPairs = await this.tokenPairsProvider.getPairs();

    return this.geTokenWithdrawalsInternal(userAddress, tokenPairs);
  }

  protected async getTokenDepositsInternal(userAddress: string, tokenPairs: readonly TokenPair[]): Promise<BridgeTokenDeposit[]> {
    const [tezosTokenDepositOperations, allEtherlinkTokenDepositOperations] = await Promise.all([
      this.tzktBridgeDataProvider.getTezosTokenDeposits(userAddress, this.tezosRollupAddress),
      this.blockscoutBridgeDataProvider.getEtherlinkTokenDeposits(this.etherlinkKernelAddress)
    ]);

    const etherlinkTokenDepositOperationsMap = this.getEtherlinkTokenDepositOperationsMap(allEtherlinkTokenDepositOperations);
    const tokenPairsMap = this.getTokenPairsMap(tokenPairs);

    return tezosTokenDepositOperations
      .map(o => this.getBridgeTokenDepositByTezosAndEtherlinkOperations(o, etherlinkTokenDepositOperationsMap, tokenPairsMap))
      .filter((d: BridgeTokenDeposit | null): d is BridgeTokenDeposit => !!d);
  }

  protected async getTokenDepositByOperationHash(operationHash: string): Promise<BridgeTokenDeposit | null> {
    const tezosTokenDepositOperation = await this.tzktBridgeDataProvider.getTezosTokenDepositByOperationHash(operationHash);
    if (!tezosTokenDepositOperation)
      return null;

    const [tokenPairs, allEtherlinkTokenDepositOperations] = await Promise.all([
      this.tokenPairsProvider.getPairs(),
      this.blockscoutBridgeDataProvider.getEtherlinkTokenDeposits(this.etherlinkKernelAddress)
    ]);
    const etherlinkTokenDepositOperationsMap = this.getEtherlinkTokenDepositOperationsMap(allEtherlinkTokenDepositOperations);
    const tokenPairsMap = this.getTokenPairsMap(tokenPairs);

    return this.getBridgeTokenDepositByTezosAndEtherlinkOperations(tezosTokenDepositOperation, etherlinkTokenDepositOperationsMap, tokenPairsMap);
  }

  protected async geTokenWithdrawalsInternal(userAddress: string, tokenPairs: readonly TokenPair[]): Promise<BridgeTokenWithdrawal[]> {
    return [];
  }

  protected async getTokenWithdrawalByOperationHash(operationHash: string): Promise<BridgeTokenWithdrawal | null> {
    return null;
  }

  protected getTezosAndEtherlinkAddresses(userAddresses: string[]): { tezosAddress?: string, etherlinkAddress?: string } {
    let tezosAddress: string | undefined;
    let etherlinkAddress: string | undefined;

    if (userAddresses[0] && validateTezosAddress(userAddresses[0]) === ValidationResult.VALID) {
      tezosAddress = userAddresses[0];
      etherlinkAddress = userAddresses[1];
    }
    else {
      tezosAddress = userAddresses[1];
      etherlinkAddress = userAddresses[0];
    }

    return {
      tezosAddress,
      etherlinkAddress
    };
  }

  private getBridgeTokenDepositByTezosAndEtherlinkOperations(
    tezosTokenDepositOperation: TokenDepositToRollupTzktTransaction,
    etherlinkTokenDepositOperationsMap: ReadonlyMap<string, TokenTransfer[]>,
    tokenPairsMap: ReadonlyMap<string, TokenPair>
  ): BridgeTokenDeposit | null {
    const depositValue = tezosTokenDepositOperation.parameter.value.LL;
    const etherlinkReceiverAddress = `0x${depositValue.bytes.substring(0, 40)}`;
    const etherlinkTokenAddress = `0x${depositValue.bytes.substring(40)}`;
    const tokenPair = tokenPairsMap.get(etherlinkTokenAddress);
    const etherlinkTokenDepositOperations = etherlinkTokenDepositOperationsMap.get(etherlinkReceiverAddress);

    const lastEtherlinkDepositOperation = etherlinkTokenDepositOperations && etherlinkTokenDepositOperations[0];
    const tezosAndEtherlinkDepositOperationsMatched = lastEtherlinkDepositOperation
      && lastEtherlinkDepositOperation.contractAddress === etherlinkTokenAddress
      && lastEtherlinkDepositOperation.to === etherlinkReceiverAddress
      && lastEtherlinkDepositOperation.value === depositValue.ticket.amount;

    if (!tokenPair) {
      if (tezosAndEtherlinkDepositOperationsMatched) {
        etherlinkTokenDepositOperations.shift();
      }
      console.warn('Unregistered token pair. Etherlink Token Address = ', etherlinkTokenAddress, 'Tezos Operation =', tezosTokenDepositOperation.hash);
      return null;
    }

    const tokenAmount = BigInt(depositValue.ticket.amount);
    const tezosOperation: BridgeTokenDeposit['tezosOperation'] = {
      blockId: tezosTokenDepositOperation.level,
      hash: tezosTokenDepositOperation.hash,
      timestamp: new Date(tezosTokenDepositOperation.timestamp).toISOString(),
      token: tokenPair.tezos.token,
      amount: tokenAmount,
      // TODO: calculate fee
      fee: 0n,
      sender: tezosTokenDepositOperation.sender.address,
      source: tezosTokenDepositOperation.initiator.address,
      receiver: etherlinkReceiverAddress,
    };

    if (tezosAndEtherlinkDepositOperationsMatched) {
      etherlinkTokenDepositOperations.shift();

      return {
        kind: BridgeTokenTransferKind.Deposit,
        status: BridgeTokenTransferStatus.Finished,
        tezosOperation,
        etherlinkOperation: {
          blockId: +lastEtherlinkDepositOperation.blockNumber,
          hash: lastEtherlinkDepositOperation.hash,
          timestamp: new Date(+lastEtherlinkDepositOperation.timeStamp * 1000).toISOString(),
          token: tokenPair.etherlink.token,
          amount: tokenAmount,
          fee: BigInt(lastEtherlinkDepositOperation.gasUsed) * BigInt(lastEtherlinkDepositOperation.gasPrice),
          source: lastEtherlinkDepositOperation.from,
          receiver: lastEtherlinkDepositOperation.to,
        }
      };
    }
    else {
      return {
        kind: BridgeTokenTransferKind.Deposit,
        status: BridgeTokenTransferStatus.Created,
        tezosOperation,
      };
    }
  }

  private getEtherlinkTokenDepositOperationsMap(allEtherlinkTokenDepositOperations: readonly TokenTransfer[]) {
    return allEtherlinkTokenDepositOperations
      .reduce((map, operation) => {
        const accountOperations = map.get(operation.to);
        if (!accountOperations)
          map.set(operation.to, [operation]);
        else
          accountOperations.push(operation);

        return map;
      },
        new Map<string, TokenTransfer[]>
      );
  }

  private getTokenPairsMap(tokenPairs: readonly TokenPair[]) {
    return tokenPairs
      .reduce((map, pair) => map.set(pair.etherlink.token.address, pair), new Map<string, TokenPair>());
  }
}
