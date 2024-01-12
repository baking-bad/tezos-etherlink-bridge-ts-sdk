import type { EtherlinkToken } from './etherlink';
import type { TezosToken } from './tezos';

export interface TezosTransferTokensOperation {
  readonly blockId: number;
  readonly hash: string;
  readonly timestamp: string;
  readonly token: TezosToken;
  readonly amount: bigint;
  readonly fee: bigint;
  readonly source: string;
  readonly sender: string;
  readonly receiver: string;
}

export interface EtherlinkTransferTokensOperation {
  readonly blockId: number;
  readonly hash: string;
  readonly timestamp: string;
  readonly token: EtherlinkToken;
  readonly amount: bigint;
  readonly fee: bigint;
  readonly source: string;
  readonly receiver: string;
}

export interface InitialRollupData {
  readonly outboxMessageLevel: bigint;
  readonly outboxMessageId: bigint;
}

export interface CementedRollupData extends InitialRollupData {
  readonly commitment: string;
  readonly proof: string;
}

export type RollupData =
  | InitialRollupData
  | CementedRollupData;

export enum BridgeTokenTransferKind {
  Deposit = 0,
  Withdrawal = 1,
  DepositRevert = 2,
  WithdrawalRevert = 3
}

export enum BridgeTokenTransferStatus {
  Created = 0,
  Sealed = 1,
  Finished = 2,
  Failed = 3
}

interface BridgeTokenTransferBase {
  readonly kind: BridgeTokenTransferKind;
  readonly status: BridgeTokenTransferStatus;
}

export interface CreatedBridgeTokenDeposit extends BridgeTokenTransferBase {
  readonly kind: BridgeTokenTransferKind.Deposit;
  readonly status: BridgeTokenTransferStatus.Created;
  readonly tezosOperation: TezosTransferTokensOperation;
}

export interface FinishedBridgeTokenDeposit extends BridgeTokenTransferBase {
  readonly kind: BridgeTokenTransferKind.Deposit;
  readonly status: BridgeTokenTransferStatus.Finished;
  readonly tezosOperation: TezosTransferTokensOperation;
  readonly etherlinkOperation: EtherlinkTransferTokensOperation;
}

export type BridgeTokenDeposit =
  | CreatedBridgeTokenDeposit
  | FinishedBridgeTokenDeposit;

export interface CreatedBridgeTokenWithdrawal extends BridgeTokenTransferBase {
  readonly kind: BridgeTokenTransferKind.Withdrawal;
  readonly status: BridgeTokenTransferStatus.Created;
  readonly etherlinkOperation: EtherlinkTransferTokensOperation;
  readonly rollupData: InitialRollupData;
}

export interface SealedBridgeTokenWithdrawal extends BridgeTokenTransferBase {
  readonly kind: BridgeTokenTransferKind.Withdrawal;
  readonly status: BridgeTokenTransferStatus.Sealed;
  readonly etherlinkOperation: EtherlinkTransferTokensOperation;
  readonly rollupData: CementedRollupData;
}

export interface FinishedBridgeTokenWithdrawal extends BridgeTokenTransferBase {
  readonly kind: BridgeTokenTransferKind.Withdrawal;
  readonly status: BridgeTokenTransferStatus.Finished;
  readonly tezosOperation: TezosTransferTokensOperation;
  readonly etherlinkOperation: EtherlinkTransferTokensOperation;
  readonly rollupData: CementedRollupData;
}

export type BridgeTokenWithdrawal =
  | CreatedBridgeTokenWithdrawal
  | SealedBridgeTokenWithdrawal
  | FinishedBridgeTokenWithdrawal;

export type BridgeTokenTransfer =
  | BridgeTokenDeposit
  | BridgeTokenWithdrawal;
