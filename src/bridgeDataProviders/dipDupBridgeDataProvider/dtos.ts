export interface TezosTokenDto {
  contract_address: string;
  token_id: string;
}

interface TicketDto {
  token: TezosTokenDto;
}

interface InboxMessageDto {
  id: number;
  index: number;
}

interface L1TransactionDto {
  operation_hash: string;
  level: number;
  amount: string;
  sender: string;
  target: string;
  initiator: string;
  counter: number;
  l1_account: string;
  l2_account: string;
  inbox_message: InboxMessageDto;
  nonce: number;
  timestamp: string;
  ticket: TicketDto;
}

interface L2TransactionDto {
  transaction_hash: string;
  level: number;
  amount: string;
  address: string;
  l2_account: string;
  log_index: number;
  timestamp: string;
  transaction_index: number;
}

export interface BridgeDepositDto {
  l1_transaction: L1TransactionDto;
  l2_transaction: L2TransactionDto | null;
}

export interface TokenTransferDto {
  bridge_deposit: BridgeDepositDto[];
}

export interface GraphQLResponse<TData> {
  data: TData;
  errors?: string[];
}
