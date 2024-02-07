export interface TezosTokenDto {
  id: string;
  // type: string;
  contract_address: string;
  token_id: string;
}

interface InboxMessageDto {
  type: string;
  level: number;
  index: number;
}

interface DepositL1TransactionDto {
  level: number;
  operation_hash: string;
  amount: string;
  ticket: {
    token: TezosTokenDto;
  };
  l1_account: string;
  l2_account: string;
  timestamp: string;
  inbox_message: InboxMessageDto;
}

interface DepositL2TransactionDto {
  level: number;
  transaction_hash: string;
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
  operation_hash: string
  timestamp: string;
}

interface WithdrawalL2TransactionDto {
  level: number;
  transaction_hash: string;
  amount: string;
  l2_token: {
    id: string;
    ticket: {
      token: TezosTokenDto
    };
  };
  l1_account: string;
  l2_account: string;
  timestamp: string;
  outbox_message: {
    level: number;
    index: number;
    commitment: { hash: string; } | null;
    proof: string | null
  }
}

export interface BridgeWithdrawalDto {
  l1_transaction: WithdrawalL1TransactionDto | null;
  l2_transaction: WithdrawalL2TransactionDto;
}

export interface TokenTransferDto {
  bridge_deposit: BridgeDepositDto[];
  bridge_withdrawal: BridgeWithdrawalDto[];
}

export interface GraphQLResponse<TData> {
  data: TData;
  errors?: string[];
}