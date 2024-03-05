/* eslint-disable max-len */
import { PositiveTestCaseBase } from './testCase';

type TestCase = PositiveTestCaseBase<{
  operationHash: string
}>;
type TestCases = readonly TestCase[];

export const getTokenTransferQueryByTestCases: TestCases = [
  [
    'by Tezos operation hash',
    {
      operationHash: 'oocHgjpnSz9A8LRPekG4Fxspc2FW7wiBj7i3nMLpTaj4KQrSH2z',
      expectedQuery: 'query TokenTransfer { bridge_operation(where: { _or : [ { deposit: { l1_transaction: { operation_hash: { _eq: "oocHgjpnSz9A8LRPekG4Fxspc2FW7wiBj7i3nMLpTaj4KQrSH2z" } } } } { withdrawal: { l1_transaction: { operation_hash: { _eq: "oocHgjpnSz9A8LRPekG4Fxspc2FW7wiBj7i3nMLpTaj4KQrSH2z" } } } } ] }) { type is_completed is_successful created_at updated_at deposit { l1_transaction { level operation_hash amount ticket { token { type contract_address token_id } } l1_account l2_account timestamp inbox_message { type level index } } l2_transaction { level transaction_hash amount l2_token { id } timestamp } } withdrawal { l1_transaction { level operation_hash timestamp } l2_transaction { level transaction_hash amount l2_token { id ticket { token { type contract_address token_id } } } l1_account l2_account timestamp outbox_message { level index commitment { hash } proof cemented_at } } } } }'
    }
  ],
  [
    'by Etherlink operation hash',
    {
      operationHash: '0x407671cc863e14b40c404ee9bd8f7281516f44d9b4785f006dc43b4f4ef8d2f1',
      expectedQuery: 'query TokenTransfer { bridge_operation(where: { _or : [ { withdrawal: { l2_transaction: { transaction_hash: { _eq: "407671cc863e14b40c404ee9bd8f7281516f44d9b4785f006dc43b4f4ef8d2f1" } } } } { deposit: { l2_transaction: { transaction_hash: { _eq: "407671cc863e14b40c404ee9bd8f7281516f44d9b4785f006dc43b4f4ef8d2f1" } } } } ] }) { type is_completed is_successful created_at updated_at deposit { l1_transaction { level operation_hash amount ticket { token { type contract_address token_id } } l1_account l2_account timestamp inbox_message { type level index } } l2_transaction { level transaction_hash amount l2_token { id } timestamp } } withdrawal { l1_transaction { level operation_hash timestamp } l2_transaction { level transaction_hash amount l2_token { id ticket { token { type contract_address token_id } } } l1_account l2_account timestamp outbox_message { level index commitment { hash } proof cemented_at } } } } }'
    }
  ]
];
