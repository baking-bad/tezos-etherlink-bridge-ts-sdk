/* eslint-disable max-len */
import { PositiveTestCaseBase } from './testCase';

type TestCase = PositiveTestCaseBase<{
  expectedQueries: string[]
}, false>;
type TestCases = readonly TestCase[];

export const getTokenTransfersSubscriptionsTestCases: TestCases = [
  [
    'all',
    {
      expectedQueries: [
        'subscription TokenTransfers { bridge_deposit( order_by: { updated_at: desc }, limit: 1 ) { l1_transaction { level operation_hash amount ticket { token { type contract_address token_id } } l1_account l2_account timestamp inbox_message { type level index } } l2_transaction { level transaction_hash amount l2_token { id } timestamp } } }',
        'subscription TokenTransfers { bridge_withdrawal( order_by: { updated_at: desc }, limit: 1 ) { l1_transaction { level operation_hash timestamp } l2_transaction { level transaction_hash amount l2_token { id ticket { token { type contract_address token_id } } } l1_account l2_account timestamp outbox_message { level index commitment { hash } proof } } } }'
      ]
    }
  ],
];
