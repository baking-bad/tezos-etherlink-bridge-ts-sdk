/* eslint-disable max-len */
import { PositiveTestCaseBase } from './testCase';

type TestCase = PositiveTestCaseBase;
type TestCases = readonly TestCase[];

export const getTokenTransfersQueryTestCases: TestCases = [
  [
    'all',
    {
      expectedQuery: 'query TokenTransfers { bridge_deposit( order_by: { l1_transaction: { timestamp: desc } } ) { l1_transaction { level operation_hash amount ticket { token { type contract_address token_id } } l1_account l2_account timestamp inbox_message { type level index } } l2_transaction { level transaction_hash amount l2_token { id } timestamp } } bridge_withdrawal( order_by: { l2_transaction: { timestamp: desc } } ) { l1_transaction { level operation_hash timestamp } l2_transaction { level transaction_hash amount l2_token { id tezos_ticket { token { type contract_address token_id } } } l1_account l2_account timestamp outbox_message { level index commitment { hash } proof } } } }'
    }
  ],
];
