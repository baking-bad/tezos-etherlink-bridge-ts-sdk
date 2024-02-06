import type { EtherlinkToken } from '../etherlink';
import type { TezosToken } from '../tezos';

export interface TezosTransferTokensOperation {
  readonly blockId: number;
  readonly hash: string;
  readonly amount: bigint;
  readonly token: TezosToken;
  readonly source: string;
  readonly receiver: string;
  readonly receiverProxy: string | null;
  readonly fee: bigint;
  readonly timestamp: string;
}

export interface EtherlinkTransferTokensOperation {
  readonly blockId: number;
  readonly hash: string;
  readonly amount: bigint;
  readonly token: EtherlinkToken;
  readonly source: string;
  readonly receiver: string;
  readonly receiverProxy: string | null;
  readonly fee: bigint;
  readonly timestamp: string;
}

export interface InitialRollupData {
  readonly outboxMessageLevel: number;
  readonly outboxMessageIndex: number;
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
  Pending = 0,
  Created = 1,
  Sealed = 2,
  Finished = 3,
  Failed = 4
}

interface BridgeTokenTransferBase {
  readonly kind: BridgeTokenTransferKind;
  readonly status: BridgeTokenTransferStatus;
}

export interface PendingBridgeTokenDeposit extends BridgeTokenTransferBase {
  readonly kind: BridgeTokenTransferKind.Deposit;
  readonly status: BridgeTokenTransferStatus.Pending;
  readonly tezosOperation: {
    readonly hash: string;
    readonly token: TezosToken;
    readonly amount: bigint;
    readonly source: string;
    readonly receiver: string;
    readonly receiverProxy: string | null;
    readonly timestamp: string;
  }
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
  | PendingBridgeTokenDeposit
  | CreatedBridgeTokenDeposit
  | FinishedBridgeTokenDeposit;

export interface PendingBridgeTokenWithdrawal extends BridgeTokenTransferBase {
  readonly kind: BridgeTokenTransferKind.Withdrawal;
  readonly status: BridgeTokenTransferStatus.Pending;
  readonly etherlinkOperation: {
    readonly hash: string;
    readonly token: EtherlinkToken;
    readonly amount: bigint;
    readonly source: string;
    readonly receiver: string;
    readonly receiverProxy: string | null;
    readonly timestamp: string;
  }
}

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
  | PendingBridgeTokenWithdrawal
  | CreatedBridgeTokenWithdrawal
  | SealedBridgeTokenWithdrawal
  | FinishedBridgeTokenWithdrawal;

export type BridgeTokenTransfer =
  | BridgeTokenDeposit
  | BridgeTokenWithdrawal;
