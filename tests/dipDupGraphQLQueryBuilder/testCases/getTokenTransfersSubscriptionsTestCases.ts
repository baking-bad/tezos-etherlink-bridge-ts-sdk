/* eslint-disable max-len */
import { PositiveTestCaseBase } from './testCase';

type TestCase = PositiveTestCaseBase<{
  startUpdatedAt: Date
}>;
type TestCases = readonly TestCase[];

export const getTokenTransfersSubscriptionsTestCases: TestCases = [
  [
    'all',
    {
      startUpdatedAt: new Date('2024-03-17T12:13:10.104Z'),
      expectedQuery: 'subscription TokenTransfers { bridge_operation_stream( batch_size: 10, cursor: {initial_value: {updated_at: "2024-03-17T12:13:10.104Z"}, ordering: ASC} ) { type status is_completed is_successful created_at updated_at deposit { l1_transaction { level operation_hash counter nonce amount ticket { token { type contract_address token_id } } l1_account l2_account timestamp } l2_transaction { level transaction_hash log_index amount l2_token { id } timestamp } inbox_message { type level index } } withdrawal { l1_transaction { level operation_hash counter nonce timestamp } l2_transaction { level transaction_hash log_index amount l2_token { id ticket { token { type contract_address token_id } } } l1_account l2_account timestamp } outbox_message { level index commitment { hash } proof cemented_at cemented_level } } } }'
    }
  ],
];
