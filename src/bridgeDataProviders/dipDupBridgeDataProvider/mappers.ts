import type {
  BridgeDepositDto, BridgeWithdrawalDto,
  BridgeOperationDto, BridgeOperationsDto, BridgeOperationsStreamDto,
  TezosTokenDto, TokenBalancesDto
} from './dtos';
import {
  BridgeTokenTransferKind, BridgeTokenTransferStatus,
  type TezosTransferTokensOperation, type EtherlinkTransferTokensOperation,
  type BridgeTokenTransfer, type BridgeTokenDeposit, type BridgeTokenWithdrawal
} from '../../bridgeCore';
import { getErrorLogMessage, loggerProvider } from '../../logging';
import type { TezosToken, EtherlinkToken } from '../../tokens';
import { bridgeUtils, etherlinkUtils } from '../../utils';
import type { AccountTokenBalance, AccountTokenBalances } from '../balancesBridgeDataProvider';

const mapTezosTokenDtoToTezosToken = (tezosTokenDto: TezosTokenDto | undefined | null): TezosToken => {
  const preparedTokenType = tezosTokenDto?.type.toLowerCase();

  switch (preparedTokenType) {
    case 'fa1.2':
      return {
        type: 'fa1.2',
        address: tezosTokenDto!.contract_address,
      };
    case 'fa2':
      return {
        type: 'fa2',
        address: tezosTokenDto!.contract_address,
        tokenId: tezosTokenDto!.token_id
      };
    default:
      return { type: 'native' };
  }
};

const mapEtherlinkTokenDtoToEtherlinkToken = (etherlinkTokenId: string | undefined | null): EtherlinkToken => {
  return !etherlinkTokenId || etherlinkTokenId === 'xtz'
    ? { type: 'native' }
    : {
      type: 'erc20',
      address: etherlinkUtils.toChecksumAddress(etherlinkTokenId)
    };
};

export const mapBridgeDepositDtoToDepositBridgeTokenTransfer = (dto: BridgeDepositDto, isFailed: boolean): BridgeTokenDeposit | null => {
  try {
    const source = dto.l1_transaction.l1_account;
    const receiver = etherlinkUtils.toChecksumAddress(dto.l1_transaction.l2_account);

    const tezosOperation: TezosTransferTokensOperation = {
      blockId: dto.l1_transaction.level,
      hash: dto.l1_transaction.operation_hash,
      counter: dto.l1_transaction.counter,
      nonce: dto.l1_transaction.nonce,
      amount: BigInt(dto.l1_transaction.amount),
      token: mapTezosTokenDtoToTezosToken(dto.l1_transaction.ticket.token),
      timestamp: dto.l1_transaction.timestamp
    };
    const etherlinkOperation: EtherlinkTransferTokensOperation | undefined = dto.l2_transaction
      ? {
        blockId: dto.l2_transaction.level,
        hash: etherlinkUtils.prepareHexPrefix(dto.l2_transaction.transaction_hash, true),
        logIndex: dto.l2_transaction.log_index,
        amount: BigInt(dto.l2_transaction.amount),
        token: mapEtherlinkTokenDtoToEtherlinkToken(dto.l2_transaction.l2_token?.id),
        timestamp: dto.l2_transaction.timestamp
      }
      : undefined;
    const id = bridgeUtils.convertOperationDataToTokenTransferId(tezosOperation.hash, tezosOperation.counter, tezosOperation.nonce);

    return isFailed
      ? {
        id,
        kind: BridgeTokenTransferKind.Deposit,
        status: BridgeTokenTransferStatus.Failed,
        source,
        receiver,
        tezosOperation,
        etherlinkOperation
      }
      : etherlinkOperation
        ? {
          id,
          kind: BridgeTokenTransferKind.Deposit,
          status: BridgeTokenTransferStatus.Finished,
          source,
          receiver,
          tezosOperation,
          etherlinkOperation
        }
        : {
          id,
          kind: BridgeTokenTransferKind.Deposit,
          status: BridgeTokenTransferStatus.Created,
          source,
          receiver,
          tezosOperation
        };
  }
  catch (error) {
    loggerProvider.logger.error('Deposit DTO mapping error.', getErrorLogMessage(error));
    return null;
  }
};

export const mapBridgeWithdrawalDtoToWithdrawalBridgeTokenTransfer = (dto: BridgeWithdrawalDto, isFailed: boolean): BridgeTokenWithdrawal | null => {
  try {
    const source = etherlinkUtils.toChecksumAddress(dto.l2_transaction.l2_account);
    const receiver = dto.l2_transaction.l1_account;
    const amount = BigInt(dto.l2_transaction.amount);

    const etherlinkOperation: EtherlinkTransferTokensOperation = {
      blockId: dto.l2_transaction.level,
      hash: etherlinkUtils.prepareHexPrefix(dto.l2_transaction.transaction_hash, true),
      logIndex: dto.l2_transaction.log_index,
      amount,
      token: mapEtherlinkTokenDtoToEtherlinkToken(dto.l2_transaction.l2_token?.id),
      timestamp: dto.l2_transaction.timestamp
    };
    const tezosOperation: TezosTransferTokensOperation | undefined = dto.l1_transaction
      ? {
        blockId: dto.l1_transaction.level,
        hash: dto.l1_transaction.operation_hash,
        counter: dto.l1_transaction.counter,
        nonce: dto.l1_transaction.nonce,
        amount,
        token: mapTezosTokenDtoToTezosToken(dto.l2_transaction.l2_token?.ticket?.token),
        timestamp: dto.l1_transaction.timestamp
      }
      : undefined;
    const rollupData = {
      outboxMessageLevel: dto.l2_transaction.outbox_message.level,
      outboxMessageIndex: dto.l2_transaction.outbox_message.index,
      commitment: dto.l2_transaction.outbox_message.commitment?.hash || '',
      proof: dto.l2_transaction.outbox_message.proof || ''
    };
    const id = bridgeUtils.convertOperationDataToTokenTransferId(etherlinkOperation.hash, etherlinkOperation.logIndex);

    return isFailed
      ? {
        id,
        kind: BridgeTokenTransferKind.Withdrawal,
        status: BridgeTokenTransferStatus.Failed,
        source,
        receiver,
        tezosOperation,
        etherlinkOperation,
        rollupData
      }
      : tezosOperation
        ? {
          id,
          kind: BridgeTokenTransferKind.Withdrawal,
          status: BridgeTokenTransferStatus.Finished,
          source,
          receiver,
          tezosOperation,
          etherlinkOperation,
          rollupData
        }
        : rollupData.commitment && rollupData.proof
          ? {
            id,
            kind: BridgeTokenTransferKind.Withdrawal,
            status: BridgeTokenTransferStatus.Sealed,
            source,
            receiver,
            etherlinkOperation,
            rollupData
          }
          : {
            id,
            kind: BridgeTokenTransferKind.Withdrawal,
            status: BridgeTokenTransferStatus.Created,
            source,
            receiver,
            etherlinkOperation,
            rollupData: {
              outboxMessageLevel: dto.l2_transaction.outbox_message.level,
              outboxMessageIndex: dto.l2_transaction.outbox_message.index,
              estimatedOutboxMessageExecutionTimestamp: dto.l2_transaction.outbox_message.cemented_at || undefined
            }
          };
  }
  catch (error) {
    loggerProvider.logger.error('Withdrawal DTO mapping error.', getErrorLogMessage(error));
    return null;
  }
};

export const mapBridgeOperationDtoToBridgeTokenTransfer = (dto: BridgeOperationDto): BridgeTokenTransfer | null => {
  const isFailed = dto.status === 'Failed';

  return dto.type === 'deposit'
    ? mapBridgeDepositDtoToDepositBridgeTokenTransfer(dto.deposit!, isFailed)
    : mapBridgeWithdrawalDtoToWithdrawalBridgeTokenTransfer(dto.withdrawal!, isFailed);
};

export const mapBridgeOperationsDtoToBridgeTokenTransfer = (dto: BridgeOperationsDto | BridgeOperationsStreamDto): BridgeTokenTransfer[] => {
  const tokenTransfers: BridgeTokenTransfer[] = [];

  loggerProvider.logger.debug('Mapping the bridge_operation DTOs to BridgeTokenTransfer...');
  for (const bridgeOperationDto of (dto.bridge_operation || dto.bridge_operation_stream)) {
    const tokenTransfer = mapBridgeOperationDtoToBridgeTokenTransfer(bridgeOperationDto);

    tokenTransfer && tokenTransfers.push(tokenTransfer);
  }
  loggerProvider.logger.debug('Mapping has been completed.');

  return tokenTransfers;
};

export const mapTokenBalancesDtoToAccountTokenBalance = (dto: TokenBalancesDto): AccountTokenBalance | null => {
  try {
    const balanceDto = dto.l2_token_holder[0];

    return balanceDto
      ? {
        address: etherlinkUtils.toChecksumAddress(balanceDto.holder),
        balance: BigInt(balanceDto.balance),
        token: mapEtherlinkTokenDtoToEtherlinkToken(balanceDto.token),
      }
      : null;
  }
  catch (error) {
    loggerProvider.logger.error('Token Balances DTO mapping error.', getErrorLogMessage(error));
    return null;
  }
};

export const mapTokenBalancesDtoToAccountTokenBalances = (dto: TokenBalancesDto, address?: string): AccountTokenBalances => {
  try {
    const holder = dto.l2_token_holder[0]?.holder;
    return {
      address: (holder ? etherlinkUtils.toChecksumAddress(holder) : address) || '',
      tokenBalances: dto.l2_token_holder.map(balanceDto => ({
        balance: BigInt(balanceDto.balance),
        token: mapEtherlinkTokenDtoToEtherlinkToken(balanceDto.token)
      }))
    };
  }
  catch (error) {
    loggerProvider.logger.error('Token Balances DTO mapping error.', getErrorLogMessage(error));

    return {
      address: address || '',
      tokenBalances: []
    } satisfies AccountTokenBalances;
  }
};

const tokenTransferKindToBridgeOperationDtoTypeMap = new Map<BridgeTokenTransferKind, BridgeOperationDto['type']>()
  .set(BridgeTokenTransferKind.Deposit, 'deposit')
  .set(BridgeTokenTransferKind.Withdrawal, 'withdrawal');

export const mapBridgeTokenTransferKindToBridgeOperationDtoType = (kind: BridgeTokenTransferKind): BridgeOperationDto['type'] | null => {
  return tokenTransferKindToBridgeOperationDtoTypeMap.get(kind) || null;
};

export const mapBridgeTokenTransferKindsToBridgeOperationDtoTypes = (kinds: readonly BridgeTokenTransferKind[]): Array<BridgeOperationDto['type']> => {
  const result: Array<BridgeOperationDto['type']> = [];

  for (const kind of kinds) {
    const type = mapBridgeTokenTransferKindToBridgeOperationDtoType(kind);
    if (type)
      result.push(type);
  }

  return result;
};

const tokenTransferStatusToBridgeOperationDtoStatusMap = new Map<BridgeTokenTransferStatus, BridgeOperationDto['status']>()
  .set(BridgeTokenTransferStatus.Created, 'Created')
  .set(BridgeTokenTransferStatus.Sealed, 'Sealed')
  .set(BridgeTokenTransferStatus.Finished, 'Finished')
  .set(BridgeTokenTransferStatus.Failed, 'Failed');

export const mapBridgeTokenTransferStatusToBridgeOperationDtoStatus = (status: BridgeTokenTransferStatus): BridgeOperationDto['status'] | null => {
  return tokenTransferStatusToBridgeOperationDtoStatusMap.get(status) || null;
};

export const mapBridgeTokenTransferStatusesToBridgeOperationDtoStatuses = (statuses: readonly BridgeTokenTransferStatus[]): Array<BridgeOperationDto['status']> => {
  const result: Array<BridgeOperationDto['status']> = [];

  for (const status of statuses) {
    const type = mapBridgeTokenTransferStatusToBridgeOperationDtoStatus(status);
    if (type)
      result.push(type);
  }

  return result;
};
