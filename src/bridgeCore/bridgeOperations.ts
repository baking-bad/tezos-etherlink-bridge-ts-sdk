import type { TezosToken, EtherlinkToken } from '../tokens';

export interface TezosTransferTokensOperation {
  readonly blockId: number;
  readonly hash: string;
  readonly counter: number;
  readonly nonce: number | null;
  readonly amount: bigint;
  readonly token: TezosToken;
  readonly timestamp: string;
}

export interface EtherlinkTransferTokensOperation {
  readonly blockId: number;
  readonly hash: string;
  readonly logIndex: number;
  readonly amount: bigint;
  readonly token: EtherlinkToken;
  readonly timestamp: string;
}

export interface InitialRollupData {
  readonly outboxMessageLevel: number;
  readonly outboxMessageIndex: number;
  readonly estimatedOutboxMessageExecutionTimestamp?: string;
  readonly estimatedOutboxMessageExecutionLevel?: number;
}

export interface CementedRollupData {
  readonly outboxMessageLevel: number;
  readonly outboxMessageIndex: number;
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
  Created = 100,
  Sealed = 200,
  Finished = 300,
  Failed = 400
}

interface BridgeTokenTransferBase {
  readonly kind: BridgeTokenTransferKind;
  readonly status: BridgeTokenTransferStatus;
  readonly source: string;
  readonly receiver: string;
}

export interface PendingBridgeTokenDeposit extends BridgeTokenTransferBase {
  readonly kind: BridgeTokenTransferKind.Deposit;
  readonly status: BridgeTokenTransferStatus.Pending;
  readonly tezosOperation: {
    readonly hash: string;
    readonly amount: bigint;
    readonly token: TezosToken;
    readonly timestamp: string;
  }
}

export interface CreatedBridgeTokenDeposit extends BridgeTokenTransferBase {
  readonly id: string;
  readonly kind: BridgeTokenTransferKind.Deposit;
  readonly status: BridgeTokenTransferStatus.Created;
  readonly tezosOperation: TezosTransferTokensOperation;
}

export interface FinishedBridgeTokenDeposit extends BridgeTokenTransferBase {
  readonly id: string;
  readonly kind: BridgeTokenTransferKind.Deposit;
  readonly status: BridgeTokenTransferStatus.Finished;
  readonly tezosOperation: TezosTransferTokensOperation;
  readonly etherlinkOperation: EtherlinkTransferTokensOperation;
}

export interface FailedBridgeTokenDeposit extends BridgeTokenTransferBase {
  readonly id: string;
  readonly kind: BridgeTokenTransferKind.Deposit;
  readonly status: BridgeTokenTransferStatus.Failed;
  readonly error?: string;
  readonly tezosOperation: TezosTransferTokensOperation;
  readonly etherlinkOperation?: EtherlinkTransferTokensOperation;
}

export type BridgeTokenDeposit =
  | PendingBridgeTokenDeposit
  | CreatedBridgeTokenDeposit
  | FinishedBridgeTokenDeposit
  | FailedBridgeTokenDeposit;

export interface PendingBridgeTokenWithdrawal extends BridgeTokenTransferBase {
  readonly kind: BridgeTokenTransferKind.Withdrawal;
  readonly status: BridgeTokenTransferStatus.Pending;
  readonly etherlinkOperation: {
    readonly hash: string;
    readonly amount: bigint;
    readonly token: EtherlinkToken;
    readonly timestamp: string;
  }
}

export interface CreatedBridgeTokenWithdrawal extends BridgeTokenTransferBase {
  readonly id: string;
  readonly kind: BridgeTokenTransferKind.Withdrawal;
  readonly status: BridgeTokenTransferStatus.Created;
  readonly etherlinkOperation: EtherlinkTransferTokensOperation;
  readonly rollupData: InitialRollupData;
}

export interface SealedBridgeTokenWithdrawal extends BridgeTokenTransferBase {
  readonly id: string;
  readonly kind: BridgeTokenTransferKind.Withdrawal;
  readonly status: BridgeTokenTransferStatus.Sealed;
  readonly etherlinkOperation: EtherlinkTransferTokensOperation;
  readonly rollupData: CementedRollupData;
}

export interface FinishedBridgeTokenWithdrawal extends BridgeTokenTransferBase {
  readonly id: string;
  readonly kind: BridgeTokenTransferKind.Withdrawal;
  readonly status: BridgeTokenTransferStatus.Finished;
  readonly etherlinkOperation: EtherlinkTransferTokensOperation;
  readonly rollupData: CementedRollupData;
  readonly tezosOperation: TezosTransferTokensOperation;
}

export interface FailedBridgeTokenWithdrawal extends BridgeTokenTransferBase {
  readonly id: string;
  readonly kind: BridgeTokenTransferKind.Withdrawal;
  readonly status: BridgeTokenTransferStatus.Failed;
  readonly error?: string;
  readonly etherlinkOperation: EtherlinkTransferTokensOperation;
  readonly rollupData?: Partial<CementedRollupData>;
  readonly tezosOperation?: TezosTransferTokensOperation;
}

export type BridgeTokenWithdrawal =
  | PendingBridgeTokenWithdrawal
  | CreatedBridgeTokenWithdrawal
  | SealedBridgeTokenWithdrawal
  | FinishedBridgeTokenWithdrawal
  | FailedBridgeTokenWithdrawal;

export type BridgeTokenTransfer =
  | BridgeTokenDeposit
  | BridgeTokenWithdrawal;
