/* eslint-disable no-await-in-loop */
import { validateAddress as validateTezosAddress, ValidationResult } from '@taquito/utils';

import type { MixedIndexerDataProviderOptions } from './mixedIndexerDataProviderOptions';
import {
  TzktBridgeDataProvider,
  type TokenPairsProvider, BlockscoutBridgeDataProvider, TezosRollupBridgeDataProvider
} from './providers';
import type { Log as EtherlinkLog, TokenTransfer } from './providers/blockscoutBridgeDataProvider';
import type { TokenDepositToRollupTzktTransaction, TokenWithdrawalFromRollupTzktOutboxMessageExecution, TokenWithdrawalFromRollupTzktTransaction } from './providers/tzktBridgeDataProvider';
import {
  BridgeTokenTransferKind, BridgeTokenTransferStatus,
  type BridgeTokenDeposit, type BridgeTokenWithdrawal, type BridgeTokenTransfer
} from '../../bridgeOperations';
import type { EtherlinkToken } from '../../etherlink';
import type { TezosToken } from '../../tezos';
import type { BridgeDataProvider, TokenPair } from '../bridgeDataProvider';

interface MessageData {
  readonly level: bigint;
  readonly index: bigint;
}

export class MixedIndexerDataProvider implements BridgeDataProvider {
  protected readonly tokenPairsProvider: TokenPairsProvider;
  protected readonly tzktBridgeDataProvider: TzktBridgeDataProvider;
  protected readonly blockscoutBridgeDataProvider: BlockscoutBridgeDataProvider;
  protected readonly tezosRollupBridgeDataProvider: TezosRollupBridgeDataProvider;
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
    this.tezosRollupBridgeDataProvider = new TezosRollupBridgeDataProvider(options.tezosRollupBaseUrl);
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
    const [
      etherlinkTokenWithdrawalOperations,
      etherlinkTokenWithdrawalLogs,
      tezosTokenWithdrawalOperations,
      tezosTokenWithdrawalOutboxMessageExecution
    ] = await Promise.all([
      this.blockscoutBridgeDataProvider.getEtherlinkTokenWithdrawals(userAddress, this.etherlinkKernelAddress),
      this.blockscoutBridgeDataProvider.getEtherlinkTokenWithdrawalLogs(this.etherlinkKernelAddress),
      this.tzktBridgeDataProvider.getTezosTokenWithdrawals(this.tezosRollupAddress),
      this.tzktBridgeDataProvider.getTezosTokenWithdrawalOutboxMessageExecution(this.tezosRollupAddress)
    ]);
    const tokenPairsMap = this.getTokenPairsMap(tokenPairs);
    const outboxMessageDataMap = this.getOutboxMessageDataMap(etherlinkTokenWithdrawalLogs);
    const tezosTokenWithdrawalOperationsMap = this.getTezosTokenWithdrawalOperationsMap(tezosTokenWithdrawalOperations);
    const tezosTokenWithdrawalOutboxMessageExecutionMap = this.getWithdrawalOutboxMessageExecutionMap(tezosTokenWithdrawalOutboxMessageExecution);

    const promises = etherlinkTokenWithdrawalOperations
      .map(o => this.getBridgeTokenWithdrawalByEtherlinkAndTezosOperations(
        o,
        outboxMessageDataMap,
        tezosTokenWithdrawalOperationsMap,
        tezosTokenWithdrawalOutboxMessageExecutionMap,
        tokenPairsMap
      ));

    const bridgeTokenWithdrawals = await Promise.all(promises);

    return bridgeTokenWithdrawals
      .filter((w: BridgeTokenWithdrawal | null): w is BridgeTokenWithdrawal => !!w);
  }

  protected async getTokenWithdrawalByOperationHash(operationHash: string): Promise<BridgeTokenWithdrawal | null> {
    const etherlinkTokenWithdrawalOperation = await this.blockscoutBridgeDataProvider.getEtherlinkTokenWithdrawalByOperationHash(operationHash, this.etherlinkKernelAddress);
    if (!etherlinkTokenWithdrawalOperation)
      return null;

    const [
      tokenPairs,
      etherlinkTokenWithdrawalLogs,
      tezosTokenWithdrawalOperations,
      tezosTokenWithdrawalOutboxMessageExecution
    ] = await Promise.all([
      this.tokenPairsProvider.getPairs(),
      this.blockscoutBridgeDataProvider.getEtherlinkTokenWithdrawalLogs(this.etherlinkKernelAddress),
      this.tzktBridgeDataProvider.getTezosTokenWithdrawals(this.tezosRollupAddress),
      this.tzktBridgeDataProvider.getTezosTokenWithdrawalOutboxMessageExecution(this.tezosRollupAddress)
    ]);
    const tokenPairsMap = this.getTokenPairsMap(tokenPairs);
    const outboxMessageDataMap = this.getOutboxMessageDataMap(etherlinkTokenWithdrawalLogs);
    const tezosTokenWithdrawalOperationsMap = this.getTezosTokenWithdrawalOperationsMap(tezosTokenWithdrawalOperations);
    const tezosTokenWithdrawalOutboxMessageExecutionMap = this.getWithdrawalOutboxMessageExecutionMap(tezosTokenWithdrawalOutboxMessageExecution);

    const bridgeTokenWithdrawal = await this.getBridgeTokenWithdrawalByEtherlinkAndTezosOperations(
      etherlinkTokenWithdrawalOperation,
      outboxMessageDataMap,
      tezosTokenWithdrawalOperationsMap,
      tezosTokenWithdrawalOutboxMessageExecutionMap,
      tokenPairsMap
    );

    return bridgeTokenWithdrawal;
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

  private async getBridgeTokenWithdrawalByEtherlinkAndTezosOperations(
    etherlinkTokenWithdrawalOperation: TokenTransfer,
    outboxMessageDataMap: ReadonlyMap<string, MessageData>,
    tezosTokenWithdrawalOperationsMap: Map<string, TokenWithdrawalFromRollupTzktTransaction>,
    tezosTokenWithdrawalOutboxMessageExecutionMap: Map<string, TokenWithdrawalFromRollupTzktOutboxMessageExecution>,
    tokenPairsMap: ReadonlyMap<string, TokenPair>
  ): Promise<BridgeTokenWithdrawal | null> {
    const withdrawalAmount = BigInt(etherlinkTokenWithdrawalOperation.value);
    const tokenPair = tokenPairsMap.get(etherlinkTokenWithdrawalOperation.contractAddress);
    const outboxMessageData = outboxMessageDataMap.get(etherlinkTokenWithdrawalOperation.hash);

    if (!tokenPair) {
      console.warn('Unregistered token pair. Etherlink Token Address = ', etherlinkTokenWithdrawalOperation.contractAddress, 'Etherlink Operation =', etherlinkTokenWithdrawalOperation.hash);
      return null;
    }
    if (!outboxMessageData) {
      console.warn(`No impossible to extract outbox message for the ${etherlinkTokenWithdrawalOperation.hash} operation`);
      return null;
    }

    const etherlinkOperation: BridgeTokenWithdrawal['etherlinkOperation'] = {
      blockId: +etherlinkTokenWithdrawalOperation.blockNumber,
      hash: etherlinkTokenWithdrawalOperation.hash,
      timestamp: new Date(+etherlinkTokenWithdrawalOperation.timeStamp * 1000).toISOString(),
      token: tokenPair.etherlink.token,
      amount: withdrawalAmount,
      fee: BigInt(etherlinkTokenWithdrawalOperation.gasUsed) * BigInt(etherlinkTokenWithdrawalOperation.gasPrice),
      source: etherlinkTokenWithdrawalOperation.from,
      receiver: etherlinkTokenWithdrawalOperation.to,
    };
    const rollupData = await this.tezosRollupBridgeDataProvider.getRollupData(outboxMessageData.level.toString(), outboxMessageData.index.toString());

    if (!rollupData) {
      return {
        kind: BridgeTokenTransferKind.Withdrawal,
        status: BridgeTokenTransferStatus.Created,
        etherlinkOperation,
        rollupData: {
          outboxMessageLevel: outboxMessageData.level,
          outboxMessageId: outboxMessageData.index
        }
      };
    }

    const outboxMessageExecution = tezosTokenWithdrawalOutboxMessageExecutionMap.get(rollupData.commitment);
    const tezosTokenWithdrawalOperation = outboxMessageExecution && tezosTokenWithdrawalOperationsMap.get(outboxMessageExecution.hash);

    return tezosTokenWithdrawalOperation
      ? {
        kind: BridgeTokenTransferKind.Withdrawal,
        status: BridgeTokenTransferStatus.Finished,
        etherlinkOperation,
        tezosOperation: {
          blockId: tezosTokenWithdrawalOperation.level,
          hash: tezosTokenWithdrawalOperation.hash,
          timestamp: new Date(tezosTokenWithdrawalOperation.timestamp).toISOString(),
          token: tokenPair.tezos.token,
          amount: withdrawalAmount,
          // TODO: calculate fee
          fee: 0n,
          sender: tezosTokenWithdrawalOperation.sender.address,
          source: tezosTokenWithdrawalOperation.initiator.address,
          receiver: tezosTokenWithdrawalOperation.parameter.value.receiver,
        },
        rollupData: {
          outboxMessageLevel: outboxMessageData.level,
          outboxMessageId: outboxMessageData.index,
          commitment: rollupData.commitment,
          proof: rollupData.proof
        }
      }
      : {
        kind: BridgeTokenTransferKind.Withdrawal,
        status: BridgeTokenTransferStatus.Sealed,
        etherlinkOperation,
        rollupData: {
          outboxMessageLevel: outboxMessageData.level,
          outboxMessageId: outboxMessageData.index,
          commitment: rollupData.commitment,
          proof: rollupData.proof
        }
      };
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

  private getOutboxMessageDataMap(logs: readonly EtherlinkLog[]): Map<string, MessageData> {
    return logs.reduce(
      (map, log) => {
        const outboxLevelBytes = log.data.substring(258, 322);
        const outboxMessageIdBytes = log.data.substring(322);

        const messageData: MessageData = {
          level: BigInt('0x' + outboxLevelBytes),
          index: BigInt('0x' + outboxMessageIdBytes),
        };

        return map.set(log.transactionHash, messageData);
      },
      new Map<string, MessageData>
    );
  }

  private getTezosTokenWithdrawalOperationsMap(operations: TokenWithdrawalFromRollupTzktTransaction[]): Map<string, TokenWithdrawalFromRollupTzktTransaction> {
    return operations.reduce(
      (map, op) => map.set(op.hash, op),
      new Map<string, TokenWithdrawalFromRollupTzktTransaction>()
    );
  }

  private getWithdrawalOutboxMessageExecutionMap(execution: TokenWithdrawalFromRollupTzktOutboxMessageExecution[]): Map<string, TokenWithdrawalFromRollupTzktOutboxMessageExecution> {
    return execution.reduce(
      (map, ex) => map.set(ex.commitment.hash, ex),
      new Map<string, TokenWithdrawalFromRollupTzktOutboxMessageExecution>()
    );
  }

  private getTezosAndEtherlinkAddresses(userAddresses: string[]): { tezosAddress?: string, etherlinkAddress?: string } {
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
}
