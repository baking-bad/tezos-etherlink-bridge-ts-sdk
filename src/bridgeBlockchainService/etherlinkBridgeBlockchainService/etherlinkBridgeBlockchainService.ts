import type { NonNativeEtherlinkToken } from '../../tokens';
import type { BridgeBlockchainService } from '../bridgeBlockchainService';

interface WithdrawTokenParamsBase {
  amount: bigint;
  tezosReceiverAddress: string;
}

export interface WithdrawNativeTokenParams extends WithdrawTokenParamsBase {
}

export interface WithdrawNonNativeTokenParams extends WithdrawTokenParamsBase {
  token: NonNativeEtherlinkToken;
  tezosTicketerAddress: string;
  tezosTicketerContent: string;
}

export interface CreateWithdrawNativeTokenOperationParams extends WithdrawNativeTokenParams {
}

export interface CreateWithdrawNonNativeTokenOperationParams extends WithdrawNonNativeTokenParams {
}

interface OperationResult {
  hash: string;
  timestamp: string;
}

export interface WithdrawNativeTokenResult extends OperationResult {
  amount: bigint;
}

export interface WithdrawNonNativeTokenResult extends OperationResult {
  amount: bigint;
}

export interface EtherlinkBridgeBlockchainService<
  TWithdrawNativeTokenExtraResult = unknown,
  TWithdrawNonNativeTokenExtraResult = unknown,
  TCreateWithdrawNativeTokenOperationResult = unknown,
  TCreateWithdrawNonNativeTokenOperationResult = unknown,
> extends BridgeBlockchainService {
  withdrawNativeToken(params: WithdrawNativeTokenParams): Promise<WithdrawNativeTokenResult & TWithdrawNativeTokenExtraResult>;
  withdrawNonNativeToken(params: WithdrawNonNativeTokenParams): Promise<WithdrawNonNativeTokenResult & TWithdrawNonNativeTokenExtraResult>;

  createWithdrawNativeTokenOperation(params: CreateWithdrawNativeTokenOperationParams): Promise<TCreateWithdrawNativeTokenOperationResult>;
  createWithdrawNonNativeTokenOperation(params: CreateWithdrawNonNativeTokenOperationParams): Promise<TCreateWithdrawNonNativeTokenOperationResult>;
}
