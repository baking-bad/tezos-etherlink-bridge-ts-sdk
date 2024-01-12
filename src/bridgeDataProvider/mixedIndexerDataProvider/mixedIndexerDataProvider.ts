/* eslint-disable no-await-in-loop */
import { unpackDataBytes } from '@taquito/michel-codec';
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
import type { FA12Token, FA2Token, TezosToken } from '../../tezos';
import { tezosUtils } from '../../utils';
import type { BridgeDataProvider, TokenPair } from '../bridgeDataProvider';

interface EtherlinkWithdrawalEventData {
  readonly level: bigint;
  readonly index: bigint;
  readonly tezosReceiverAddress: string;
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
    const etherlinkWithdrawalEventDataMap = this.getEtherlinkWithdrawalEventDataMap(etherlinkTokenWithdrawalLogs);
    const tezosTokenWithdrawalOperationsMap = this.getTezosTokenWithdrawalOperationsMap(tezosTokenWithdrawalOperations);
    const tezosTokenWithdrawalOutboxMessageExecutionMap = this.getWithdrawalOutboxMessageExecutionMap(tezosTokenWithdrawalOutboxMessageExecution);

    const promises: Array<Promise<BridgeTokenWithdrawal | null>> = [];
    for (let i = etherlinkTokenWithdrawalOperations.length - 1; i >= 0; i--) {
      const etherlinkTokenWithdrawalOperation = etherlinkTokenWithdrawalOperations[i]!;

      promises.push(this.getBridgeTokenWithdrawalByEtherlinkAndTezosOperations(
        etherlinkTokenWithdrawalOperation,
        etherlinkWithdrawalEventDataMap,
        tezosTokenWithdrawalOperationsMap,
        tezosTokenWithdrawalOutboxMessageExecutionMap,
        tokenPairsMap
      ));
    }

    // const promises = etherlinkTokenWithdrawalOperations
    //   .map(o => this.getBridgeTokenWithdrawalByEtherlinkAndTezosOperations(
    //     o,
    //     etherlinkWithdrawalEventDataMap,
    //     tezosTokenWithdrawalOperationsMap,
    //     tezosTokenWithdrawalOutboxMessageExecutionMap,
    //     tokenPairsMap
    //   ));

    const bridgeTokenWithdrawals = (await Promise.all(promises)).reverse();

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
    const etherlinkWithdrawalEventDataMap = this.getEtherlinkWithdrawalEventDataMap(etherlinkTokenWithdrawalLogs);
    const tezosTokenWithdrawalOperationsMap = this.getTezosTokenWithdrawalOperationsMap(tezosTokenWithdrawalOperations);
    const tezosTokenWithdrawalOutboxMessageExecutionMap = this.getWithdrawalOutboxMessageExecutionMap(tezosTokenWithdrawalOutboxMessageExecution);

    const bridgeTokenWithdrawal = await this.getBridgeTokenWithdrawalByEtherlinkAndTezosOperations(
      etherlinkTokenWithdrawalOperation,
      etherlinkWithdrawalEventDataMap,
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
    etherlinkWithdrawalEventDataMap: ReadonlyMap<string, EtherlinkWithdrawalEventData>,
    tezosTokenWithdrawalOperationsMap: Map<string, TokenWithdrawalFromRollupTzktTransaction[]>,
    tezosTokenWithdrawalOutboxMessageExecutionMap: Map<string, TokenWithdrawalFromRollupTzktOutboxMessageExecution>,
    tokenPairsMap: ReadonlyMap<string, TokenPair>
  ): Promise<BridgeTokenWithdrawal | null> {
    const withdrawalAmount = BigInt(etherlinkTokenWithdrawalOperation.value);
    const tokenPair = tokenPairsMap.get(etherlinkTokenWithdrawalOperation.contractAddress);
    const etherlinkWithdrawalEventData = etherlinkWithdrawalEventDataMap.get(etherlinkTokenWithdrawalOperation.hash);

    if (!tokenPair) {
      console.warn('Unregistered token pair. Etherlink Token Address = ', etherlinkTokenWithdrawalOperation.contractAddress, 'Etherlink Operation =', etherlinkTokenWithdrawalOperation.hash);
      return null;
    }
    if (!etherlinkWithdrawalEventData) {
      console.warn(`No impossible to extract etherlink withdrawal event data for the ${etherlinkTokenWithdrawalOperation.hash} operation`);
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
    const rollupData = await this.tezosRollupBridgeDataProvider.getRollupData(etherlinkWithdrawalEventData.level.toString(), etherlinkWithdrawalEventData.index.toString());

    if (!rollupData) {
      return {
        kind: BridgeTokenTransferKind.Withdrawal,
        status: BridgeTokenTransferStatus.Created,
        etherlinkOperation,
        rollupData: {
          outboxMessageLevel: etherlinkWithdrawalEventData.level,
          outboxMessageId: etherlinkWithdrawalEventData.index
        }
      };
    }

    const tezosTokenWithdrawalOperationData = this.findCorrespondingTezosTokenWithdrawalOperationByEtherlinkOperation(
      etherlinkTokenWithdrawalOperation,
      etherlinkWithdrawalEventData,
      tezosTokenWithdrawalOperationsMap,
      tokenPair
    );
    if (tezosTokenWithdrawalOperationData) {
      const tezosTokenWithdrawalOperation = tezosTokenWithdrawalOperationData.accountWithdrawalOperation;
      tezosTokenWithdrawalOperationData.accountWithdrawalOperations.splice(
        tezosTokenWithdrawalOperationData.accountWithdrawalOperationIndex,
        1
      );

      return {
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
          outboxMessageLevel: etherlinkWithdrawalEventData.level,
          outboxMessageId: etherlinkWithdrawalEventData.index,
          commitment: rollupData.commitment,
          proof: rollupData.proof
        }
      };
    }

    return {
      kind: BridgeTokenTransferKind.Withdrawal,
      status: BridgeTokenTransferStatus.Sealed,
      etherlinkOperation,
      rollupData: {
        outboxMessageLevel: etherlinkWithdrawalEventData.level,
        outboxMessageId: etherlinkWithdrawalEventData.index,
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

  private getEtherlinkWithdrawalEventDataMap(logs: readonly EtherlinkLog[]): Map<string, EtherlinkWithdrawalEventData> {
    return logs.reduce(
      (map, log) => {
        const tezosReceiverAddressBytes = log.data.substring(130, 174);
        const outboxLevelBytes = log.data.substring(258, 322);
        const outboxMessageIdBytes = log.data.substring(322);

        const messageData: EtherlinkWithdrawalEventData = {
          level: BigInt('0x' + outboxLevelBytes),
          index: BigInt('0x' + outboxMessageIdBytes),
          tezosReceiverAddress: tezosUtils.convertBytesToAddress(tezosReceiverAddressBytes)
        };

        return map.set(log.transactionHash, messageData);
      },
      new Map<string, EtherlinkWithdrawalEventData>
    );
  }

  private getTezosTokenWithdrawalOperationsMap(allTezosTokenWithdrawalOperations: TokenWithdrawalFromRollupTzktTransaction[]): Map<string, TokenWithdrawalFromRollupTzktTransaction[]> {
    return allTezosTokenWithdrawalOperations
      .reduce((map, operation) => {
        const accountOperations = map.get(operation.parameter.value.receiver);
        if (!accountOperations)
          map.set(operation.parameter.value.receiver, [operation]);
        else
          accountOperations.push(operation);

        return map;
      },
        new Map<string, TokenWithdrawalFromRollupTzktTransaction[]>
      );
  }

  private getWithdrawalOutboxMessageExecutionMap(execution: TokenWithdrawalFromRollupTzktOutboxMessageExecution[]): Map<string, TokenWithdrawalFromRollupTzktOutboxMessageExecution> {
    return execution.reduce(
      (map, ex) => map.set(ex.commitment.hash, ex),
      new Map<string, TokenWithdrawalFromRollupTzktOutboxMessageExecution>()
    );
  }

  private findCorrespondingTezosTokenWithdrawalOperationByEtherlinkOperation(
    etherlinkTokenWithdrawalOperation: TokenTransfer,
    etherlinkWithdrawalEventData: EtherlinkWithdrawalEventData,
    tezosTokenWithdrawalOperationsMap: Map<string, TokenWithdrawalFromRollupTzktTransaction[]>,
    tokenPair: TokenPair
  ): {
    accountWithdrawalOperations: TokenWithdrawalFromRollupTzktTransaction[],
    accountWithdrawalOperation: TokenWithdrawalFromRollupTzktTransaction,
    accountWithdrawalOperationIndex: number
  } | null {
    const accountWithdrawalOperations = tezosTokenWithdrawalOperationsMap.get(etherlinkWithdrawalEventData.tezosReceiverAddress);
    if (!accountWithdrawalOperations)
      return null;

    for (let i = accountWithdrawalOperations.length - 1; i >= 0; i--) {
      const accountWithdrawalOperation = accountWithdrawalOperations[i]!;
      const tezosTokenFromTicket = this.extractTokenFromTicket(accountWithdrawalOperation.parameter.value.ticket);

      if (tezosTokenFromTicket.address === tokenPair.tezos.token.address
        && (!tezosUtils.isFA2Token(tokenPair.tezos.token) || tokenPair.tezos.token.tokenId === (tezosTokenFromTicket as FA2Token).tokenId)
        && accountWithdrawalOperation.parameter.value.receiver === etherlinkWithdrawalEventData.tezosReceiverAddress
        && BigInt(etherlinkTokenWithdrawalOperation.value) === BigInt(accountWithdrawalOperation.parameter.value.ticket.amount)
      ) {
        return {
          accountWithdrawalOperations,
          accountWithdrawalOperation,
          accountWithdrawalOperationIndex: i
        };
      }
    }

    // for (const accountWithdrawalOperation of accountWithdrawalOperations) {
    //   const tezosTokenFromTicket = this.extractTokenFromTicket(accountWithdrawalOperation.parameter.value.ticket);

    //   if (tezosTokenFromTicket.address === tokenPair.tezos.token.address
    //     && (!tezosUtils.isFA2Token(tokenPair.tezos.token) || tokenPair.tezos.token.tokenId === (tezosTokenFromTicket as FA2Token).tokenId)
    //     && accountWithdrawalOperation.parameter.value.receiver === etherlinkWithdrawalEventData.tezosReceiverAddress
    //     && BigInt(etherlinkTokenWithdrawalOperation.value) === BigInt(accountWithdrawalOperation.parameter.value.ticket.amount)
    //   ) {
    //     return accountWithdrawalOperation;
    //   }
    // }

    return null;
  }

  private extractTokenFromTicket(ticket: TokenWithdrawalFromRollupTzktTransaction['parameter']['value']['ticket']): TezosToken {
    const ticketTokenDataMichelsonMapEntries: any = unpackDataBytes({ bytes: ticket.data.bytes });
    const ticketTokenDataMap: Map<string, string> = ticketTokenDataMichelsonMapEntries.reduce(
      (map: Map<string, string>, entry: any) => map.set(entry.args[0].string, entry.args[1].bytes),
      new Map<string, string>()
    );

    const tokenTypeBytes: string | undefined = ticketTokenDataMap.get('token_type');
    const tokenAddressBytes: string | undefined = ticketTokenDataMap.get('contract_address');
    const tokenFa2IdBytes: string | undefined = ticketTokenDataMap.get('token_id');

    if (!tokenTypeBytes || !tokenAddressBytes)
      throw new Error('Wrong ticket data');

    const tokenType: string = (unpackDataBytes({ bytes: tokenTypeBytes }) as any).string;
    const tokenAddress = (unpackDataBytes({ bytes: tokenAddressBytes }, { prim: 'address' }) as any).string;

    if (tokenType === 'FA1.2') {
      return {
        address: tokenAddress
      };
    }
    else if (tokenType === 'FA2') {
      if (!tokenFa2IdBytes)
        throw new Error('There is no FA2 token Id');

      const tokenFa2Id: string = (unpackDataBytes({ bytes: tokenFa2IdBytes }) as any).int;
      return {
        address: tokenAddress,
        tokenId: tokenFa2Id
      };
    }
    else
      throw new Error(`Unknown token type: ${tokenType}`);
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
