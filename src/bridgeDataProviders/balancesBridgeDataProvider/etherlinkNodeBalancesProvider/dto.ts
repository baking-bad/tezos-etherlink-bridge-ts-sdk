export type BalanceData = string;

export interface RPCNodeError {
  code: number;
  message: string;
}

export interface RPCNodeResponse<TData> {
  result: TData;
  error?: RPCNodeError;
}
