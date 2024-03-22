export interface TezosTokenDto {
  type: string;
  contract_address: string;
  token_id: string;
}

interface InboxMessageDto {
  type: string;
  level: number;
  index: number;
}

interface TezosTicketDto {
  token: TezosTokenDto;
}

interface DepositL1TransactionDto {
  level: number;
  operation_hash: string;
  counter: number;
  nonce: number | null;
  amount: string;
  ticket: TezosTicketDto;
  l1_account: string;
  l2_account: string;
  timestamp: string;
  inbox_message: InboxMessageDto;
}

interface DepositL2TransactionDto {
  level: number;
  transaction_hash: string;
  log_index: number;
  amount: string;
  l2_token: {
    id: string;
  };
  timestamp: string;
}

export interface BridgeDepositDto {
  l1_transaction: DepositL1TransactionDto;
  l2_transaction: DepositL2TransactionDto | null;
}

interface WithdrawalL1TransactionDto {
  level: number;
  operation_hash: string;
  counter: number;
  nonce: number | null;
  timestamp: string;
}

interface WithdrawalL2TransactionDto {
  level: number;
  transaction_hash: string;
  log_index: number;
  amount: string;
  l2_token: {
    id: string;
    ticket: TezosTicketDto;
  };
  l1_account: string;
  l2_account: string;
  timestamp: string;
  outbox_message: {
    level: number;
    index: number;
    commitment: { hash: string; } | null;
    proof: string | null;
    cemented_at: string | null;
  }
}

export interface BridgeWithdrawalDto {
  l1_transaction: WithdrawalL1TransactionDto | null;
  l2_transaction: WithdrawalL2TransactionDto;
}

export interface BridgeOperationDto {
  type: 'deposit' | 'withdrawal';
  status: 'Created' | 'Sealed' | 'Finished' | 'Failed';
  is_completed: boolean;
  is_successful: boolean;
  created_at: string;
  updated_at: string;
  deposit: BridgeDepositDto | null;
  withdrawal: BridgeWithdrawalDto | null;
}

export interface BridgeOperationsDto {
  bridge_operation: BridgeOperationDto[];
  bridge_operation_stream: never;
}

export interface BridgeOperationsStreamDto {
  bridge_operation: never;
  bridge_operation_stream: BridgeOperationDto[];
}

export interface TokenBalancesDto {
  l2_token_holder: Array<{
    balance: number,
    holder: string,
    token: string
  }>;
}

export interface GraphQLError {
  message: string;
}

export interface GraphQLResponse<TData> {
  data: TData;
  errors?: GraphQLError[];
}
