import type { EtherlinkToken } from './etherlink';
import type { TezosToken } from './tezos';

export interface TezosTransferTokensOperation {
  readonly blockId: number;
  readonly hash: string;
  readonly timestamp: string;
  readonly token: TezosToken;
  readonly amount: bigint;
  readonly fee: bigint;
  readonly sender: string;
  readonly source: string;
  readonly receiver: string;
}

export interface EtherlinkTransferTokensOperation {
  readonly blockId: number;
  readonly hash: string;
  readonly timestamp: string;
  readonly token: EtherlinkToken;
  readonly amount: bigint;
  readonly fee: bigint;
  readonly sender: string;
  readonly source: string;
  readonly receiver: string;
}

export enum BridgeTokenTransferKind {
  Deposit = 0,
  Withdrawal = 1,
  DepositRevert = 2,
  WithdrawalRevert = 3
}

interface BridgeTokenTransferBase {
  readonly kind: BridgeTokenTransferKind;
}

export interface BridgeTokenDeposit extends BridgeTokenTransferBase {
  readonly kind: BridgeTokenTransferKind.Deposit;
  readonly tezosOperation: TezosTransferTokensOperation;
}

export interface BridgeTokenPartialWithdrawal extends BridgeTokenTransferBase {
  readonly kind: BridgeTokenTransferKind.Withdrawal;
  readonly etherlinkOperation: TezosTransferTokensOperation;
}

export interface BridgeTokenFullWithdrawal extends BridgeTokenTransferBase {
  readonly kind: BridgeTokenTransferKind.Withdrawal;
  readonly etherlinkOperation: TezosTransferTokensOperation;
  readonly tezosOperation: TezosTransferTokensOperation;
}

export type BridgeTokenWithdrawal = BridgeTokenPartialWithdrawal | BridgeTokenFullWithdrawal;

export type BridgeTokenTransfer =
  | BridgeTokenDeposit
  | BridgeTokenWithdrawal;
