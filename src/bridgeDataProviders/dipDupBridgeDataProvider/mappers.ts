import type { BridgeDepositDto, TezosTokenDto } from './dtos';
import {
  BridgeTokenTransferKind, BridgeTokenTransferStatus,
  type BridgeTokenDeposit, type CreatedBridgeTokenDeposit
} from '../../bridge';
import type { EtherlinkToken } from '../../etherlink';
import type { TezosToken } from '../../tezos';
import { etherlinkUtils } from '../../utils';

const mapTezosTokenDtoToTezosToken = (tezosTokenDto: TezosTokenDto): TezosToken => {
  if (tezosTokenDto.contract_address === 'KT1000000000000000000000000000000000')
    return { type: 'native' };

  // TODO: detect fa2 token
  return { type: 'fa1.2', address: tezosTokenDto.contract_address };
};

const mapEtherlinkTokenDtoToEtherlinkToken = (): EtherlinkToken => {
  // TODO: receive the etherlink token from DipDup
  return {
    type: 'erc20',
    address: '0x0000000000000000000000000000000000000000'
  };
};

export const mapBridgeDepositDtoToDepositBridgeTokenTransfer = (dto: BridgeDepositDto): BridgeTokenDeposit => {
  const tezosOperation: CreatedBridgeTokenDeposit['tezosOperation'] = {
    blockId: dto.l1_transaction.level,
    hash: dto.l1_transaction.operation_hash,
    timestamp: dto.l1_transaction.timestamp,
    token: mapTezosTokenDtoToTezosToken(dto.l1_transaction.ticket.token),
    amount: BigInt(dto.l1_transaction.amount),
    // TODO: receive the fee
    fee: 0n,
    source: dto.l1_transaction.initiator,
    receiver: etherlinkUtils.toChecksumAddress(dto.l1_transaction.l2_account),
    // TODO: receive the receiverProxy
    receiverProxy: null
  };

  return dto.l2_transaction
    ? {
      kind: BridgeTokenTransferKind.Deposit,
      status: BridgeTokenTransferStatus.Finished,
      tezosOperation,
      etherlinkOperation: {
        blockId: dto.l2_transaction.level,
        hash: etherlinkUtils.prepareHexPrefix(dto.l2_transaction.transaction_hash, true),
        amount: BigInt(dto.l2_transaction.amount),
        token: mapEtherlinkTokenDtoToEtherlinkToken(),
        // TODO: receive the fee
        fee: 0n,
        source: etherlinkUtils.toChecksumAddress(dto.l2_transaction.address),
        receiver: etherlinkUtils.toChecksumAddress(dto.l2_transaction.l2_account),
        // TODO: receive the receiverProxy
        receiverProxy: null,
        timestamp: dto.l2_transaction.timestamp
      }
    }
    : {
      kind: BridgeTokenTransferKind.Deposit,
      status: BridgeTokenTransferStatus.Created,
      tezosOperation
    };
};
