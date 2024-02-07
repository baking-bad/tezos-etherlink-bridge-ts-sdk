import type { BridgeDepositDto, BridgeWithdrawalDto, TezosTokenDto } from './dtos';
import {
  BridgeTokenTransferKind, BridgeTokenTransferStatus,
  type BridgeTokenDeposit, type CreatedBridgeTokenDeposit, BridgeTokenWithdrawal, CreatedBridgeTokenWithdrawal
} from '../../bridge';
import type { EtherlinkToken } from '../../etherlink';
import type { TezosToken } from '../../tezos';
import { etherlinkUtils } from '../../utils';

const mapTezosTokenDtoToTezosToken = (tezosTokenDto: TezosTokenDto): TezosToken => {
  const preparedTokenType = tezosTokenDto.type.toLowerCase();

  return preparedTokenType === 'fa1.2'
    ? {
      type: 'fa1.2',
      address: tezosTokenDto.contract_address,
    }
    : preparedTokenType === 'fa2'
      ? {
        type: 'fa2',
        address: tezosTokenDto.contract_address,
        tokenId: tezosTokenDto.token_id
      }
      : { type: 'native' };
};

const mapEtherlinkTokenDtoToEtherlinkToken = (contractAddress: string): EtherlinkToken => {
  return {
    type: 'erc20',
    address: etherlinkUtils.toChecksumAddress(contractAddress)
  };
};

export const mapBridgeDepositDtoToDepositBridgeTokenTransfer = (dto: BridgeDepositDto): BridgeTokenDeposit => {
  const source = dto.l1_transaction.l1_account;
  const receiver = etherlinkUtils.toChecksumAddress(dto.l1_transaction.l2_account);

  const tezosOperation: CreatedBridgeTokenDeposit['tezosOperation'] = {
    blockId: dto.l1_transaction.level,
    hash: dto.l1_transaction.operation_hash,
    amount: BigInt(dto.l1_transaction.amount),
    token: mapTezosTokenDtoToTezosToken(dto.l1_transaction.ticket.token),
    // TODO: receive the fee
    fee: 0n,
    timestamp: dto.l1_transaction.timestamp
  };

  return dto.l2_transaction
    ? {
      kind: BridgeTokenTransferKind.Deposit,
      status: BridgeTokenTransferStatus.Finished,
      source,
      receiver,
      tezosOperation,
      etherlinkOperation: {
        blockId: dto.l2_transaction.level,
        hash: etherlinkUtils.prepareHexPrefix(dto.l2_transaction.transaction_hash, true),
        amount: BigInt(dto.l2_transaction.amount),
        token: mapEtherlinkTokenDtoToEtherlinkToken(dto.l2_transaction.l2_token.id),
        // TODO: receive the fee
        fee: 0n,
        timestamp: dto.l2_transaction.timestamp
      }
    }
    : {
      kind: BridgeTokenTransferKind.Deposit,
      status: BridgeTokenTransferStatus.Created,
      source,
      receiver,
      tezosOperation
    };
};

export const mapBridgeWithdrawalDtoToWithdrawalBridgeTokenTransfer = (dto: BridgeWithdrawalDto): BridgeTokenWithdrawal => {
  const source = etherlinkUtils.toChecksumAddress(dto.l2_transaction.l2_account);
  const receiver = dto.l2_transaction.l1_account;
  const amount = BigInt(dto.l2_transaction.amount);

  const etherlinkOperation: CreatedBridgeTokenWithdrawal['etherlinkOperation'] = {
    blockId: dto.l2_transaction.level,
    hash: etherlinkUtils.prepareHexPrefix(dto.l2_transaction.transaction_hash, true),
    amount,
    token: mapEtherlinkTokenDtoToEtherlinkToken(dto.l2_transaction.l2_token.id),
    // TODO: receive the fee
    fee: 0n,
    timestamp: dto.l2_transaction.timestamp
  };

  return dto.l1_transaction
    ? {
      kind: BridgeTokenTransferKind.Withdrawal,
      status: BridgeTokenTransferStatus.Finished,
      source,
      receiver,
      tezosOperation: {
        blockId: dto.l1_transaction.level,
        hash: dto.l1_transaction.operation_hash,
        amount,
        token: mapTezosTokenDtoToTezosToken(dto.l2_transaction.l2_token.tezos_ticket.token),
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
        kind: BridgeTokenTransferKind.Withdrawal,
        status: BridgeTokenTransferStatus.Created,
        source,
        receiver,
        etherlinkOperation,
        rollupData: {
          outboxMessageLevel: dto.l2_transaction.outbox_message.level,
          outboxMessageIndex: dto.l2_transaction.outbox_message.index
        }
      };
};
