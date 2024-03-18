import type {
  BridgeDepositDto, BridgeWithdrawalDto,
  BridgeOperationDto, BridgeOperationsDto, BridgeOperationsStreamDto,
  TezosTokenDto, TokenBalancesDto
} from './dtos';
import {
  BridgeTokenTransferKind, BridgeTokenTransferStatus,
  type BridgeTokenTransfer,
  type BridgeTokenDeposit, type CreatedBridgeTokenDeposit,
  type BridgeTokenWithdrawal, type CreatedBridgeTokenWithdrawal
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

export const mapBridgeDepositDtoToDepositBridgeTokenTransfer = (dto: BridgeDepositDto): BridgeTokenDeposit | null => {
  try {
    const source = dto.l1_transaction.l1_account;
    const receiver = etherlinkUtils.toChecksumAddress(dto.l1_transaction.l2_account);

    const tezosOperation: CreatedBridgeTokenDeposit['tezosOperation'] = {
      blockId: dto.l1_transaction.level,
      hash: dto.l1_transaction.operation_hash,
      counter: dto.l1_transaction.counter,
      nonce: dto.l1_transaction.nonce,
      amount: BigInt(dto.l1_transaction.amount),
      token: mapTezosTokenDtoToTezosToken(dto.l1_transaction.ticket.token),
      // TODO: receive the fee
      fee: 0n,
      timestamp: dto.l1_transaction.timestamp
    };
    const id = bridgeUtils.convertOperationDataToTokenTransferId(tezosOperation.hash, tezosOperation.counter, tezosOperation.nonce);

    return dto.l2_transaction
      ? {
        id,
        kind: BridgeTokenTransferKind.Deposit,
        status: BridgeTokenTransferStatus.Finished,
        source,
        receiver,
        tezosOperation,
        etherlinkOperation: {
          blockId: dto.l2_transaction.level,
          hash: etherlinkUtils.prepareHexPrefix(dto.l2_transaction.transaction_hash, true),
          logIndex: dto.l2_transaction.log_index,
          amount: BigInt(dto.l2_transaction.amount),
          token: mapEtherlinkTokenDtoToEtherlinkToken(dto.l2_transaction.l2_token?.id),
          // TODO: receive the fee
          fee: 0n,
          timestamp: dto.l2_transaction.timestamp
        }
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

export const mapBridgeWithdrawalDtoToWithdrawalBridgeTokenTransfer = (dto: BridgeWithdrawalDto): BridgeTokenWithdrawal | null => {
  try {
    const source = etherlinkUtils.toChecksumAddress(dto.l2_transaction.l2_account);
    const receiver = dto.l2_transaction.l1_account;
    const amount = BigInt(dto.l2_transaction.amount);

    const etherlinkOperation: CreatedBridgeTokenWithdrawal['etherlinkOperation'] = {
      blockId: dto.l2_transaction.level,
      hash: etherlinkUtils.prepareHexPrefix(dto.l2_transaction.transaction_hash, true),
      logIndex: dto.l2_transaction.log_index,
      amount,
      token: mapEtherlinkTokenDtoToEtherlinkToken(dto.l2_transaction.l2_token?.id),
      // TODO: receive the fee
      fee: 0n,
      timestamp: dto.l2_transaction.timestamp
    };
    const id = bridgeUtils.convertOperationDataToTokenTransferId(etherlinkOperation.hash, etherlinkOperation.logIndex);

    return dto.l1_transaction
      ? {
        id,
        kind: BridgeTokenTransferKind.Withdrawal,
        status: BridgeTokenTransferStatus.Finished,
        source,
        receiver,
        tezosOperation: {
          blockId: dto.l1_transaction.level,
          hash: dto.l1_transaction.operation_hash,
          counter: dto.l1_transaction.counter,
          nonce: dto.l1_transaction.nonce,
          amount,
          token: mapTezosTokenDtoToTezosToken(dto.l2_transaction.l2_token?.ticket?.token),
          // TODO: receive the fee
          fee: 0n,
          timestamp: dto.l1_transaction.timestamp
        },
        etherlinkOperation,
        rollupData: {
          outboxMessageLevel: dto.l2_transaction.outbox_message.level,
          outboxMessageIndex: dto.l2_transaction.outbox_message.index,
          commitment: dto.l2_transaction.outbox_message.commitment?.hash || '',
          proof: dto.l2_transaction.outbox_message.proof || ''
        }
      }
      : dto.l2_transaction.outbox_message.commitment && dto.l2_transaction.outbox_message.proof
        ? {
          id,
          kind: BridgeTokenTransferKind.Withdrawal,
          status: BridgeTokenTransferStatus.Sealed,
          source,
          receiver,
          etherlinkOperation,
          rollupData: {
            outboxMessageLevel: dto.l2_transaction.outbox_message.level,
            outboxMessageIndex: dto.l2_transaction.outbox_message.index,
            commitment: dto.l2_transaction.outbox_message.commitment.hash,
            proof: dto.l2_transaction.outbox_message.proof
          }
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
  return dto.type === 'deposit'
    ? mapBridgeDepositDtoToDepositBridgeTokenTransfer(dto.deposit!)
    : mapBridgeWithdrawalDtoToWithdrawalBridgeTokenTransfer(dto.withdrawal!);
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
