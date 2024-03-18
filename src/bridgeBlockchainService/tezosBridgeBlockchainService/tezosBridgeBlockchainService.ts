import type { NonNativeTezosToken } from '../../tokens';
import type { BridgeBlockchainService } from '../bridgeBlockchainService';

interface DepositTokenParamsBase {
  amount: bigint;
  etherlinkReceiverAddress: string;
  ticketHelperContractAddress: string;
}

export interface DepositNativeTokenParams extends DepositTokenParamsBase {
}

export interface DepositNonNativeTokensParams extends DepositTokenParamsBase {
  token: NonNativeTezosToken;
  useApprove?: boolean;
  resetFA12Approve?: boolean;
}

export interface FinishWithdrawParams {
  cementedCommitment: string;
  outputProof: string;
}

export interface CreateDepositNativeTokenOperationParams extends DepositNativeTokenParams {
}

export interface CreateDepositNonNativeTokenOperationParams extends CreateDepositNativeTokenOperationParams {
}

interface OperationResult {
  hash: string;
  timestamp: string;
}

export interface DepositNativeTokenResult extends OperationResult {
  amount: bigint;
}

export interface DepositNonNativeTokenResult extends OperationResult {
  amount: bigint;
}

export interface FinishWithdrawResult extends OperationResult {
}

export interface TezosBridgeBlockchainService<
  TDepositNativeTokenExtraResult = unknown,
  TDepositNonNativeTokenExtraResult = unknown,
  TFinishWithdrawExtraResult = unknown,
  TCreateDepositNativeTokenOperationResult = unknown,
  TCreateDepositNonNativeTokenOperationResult = unknown,
> extends BridgeBlockchainService {
  readonly smartRollupAddress: string;

  depositNativeToken(params: DepositNativeTokenParams): Promise<DepositNativeTokenResult & TDepositNativeTokenExtraResult>;
  depositNonNativeToken(params: DepositNonNativeTokensParams): Promise<DepositNonNativeTokenResult & TDepositNonNativeTokenExtraResult>;

  finishWithdraw(params: FinishWithdrawParams): Promise<FinishWithdrawResult & TFinishWithdrawExtraResult>;

  createDepositNativeTokenOperation(params: CreateDepositNativeTokenOperationParams): Promise<TCreateDepositNativeTokenOperationResult>;
  createDepositNonNativeTokenOperation(params: CreateDepositNonNativeTokenOperationParams): Promise<TCreateDepositNonNativeTokenOperationResult>;

  getTezosTicketerContent(tezosTicketerAddress: string): Promise<string>;
}
