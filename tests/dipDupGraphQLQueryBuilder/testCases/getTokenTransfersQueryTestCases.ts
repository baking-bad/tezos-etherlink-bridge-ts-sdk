/* eslint-disable max-len */
import { PositiveTestCaseBase } from './testCase';

type TestCase = PositiveTestCaseBase<{
  offset: number,
  limit: number
}>;
type TestCases = readonly TestCase[];

export const getTokenTransfersQueryTestCases: TestCases = [
  [
    'all, offset: 0, limit: 100',
    {
      offset: 0,
      limit: 100,
      expectedQuery: 'query TokenTransfers { bridge_operation( order_by: { created_at: desc }, offset: 0, limit: 100 ) { type is_completed is_successful created_at updated_at deposit { l1_transaction { level operation_hash amount ticket { token { type contract_address token_id } } l1_account l2_account timestamp inbox_message { type level index } } l2_transaction { level transaction_hash amount l2_token { id } timestamp } } withdrawal { l1_transaction { level operation_hash timestamp } l2_transaction { level transaction_hash amount l2_token { id ticket { token { type contract_address token_id } } } l1_account l2_account timestamp outbox_message { level index commitment { hash } proof } } } } }'
    }
  ],
  [
    'all, offset: 300, limit: 10',
    {
      offset: 300,
      limit: 10,
      expectedQuery: 'query TokenTransfers { bridge_operation( order_by: { created_at: desc }, offset: 300, limit: 10 ) { type is_completed is_successful created_at updated_at deposit { l1_transaction { level operation_hash amount ticket { token { type contract_address token_id } } l1_account l2_account timestamp inbox_message { type level index } } l2_transaction { level transaction_hash amount l2_token { id } timestamp } } withdrawal { l1_transaction { level operation_hash timestamp } l2_transaction { level transaction_hash amount l2_token { id ticket { token { type contract_address token_id } } } l1_account l2_account timestamp outbox_message { level index commitment { hash } proof } } } } }'
    }
  ],
];
