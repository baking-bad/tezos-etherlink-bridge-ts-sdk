/* eslint-disable max-len */
import { PositiveTestCaseBase } from './testCase';

type TestCase = PositiveTestCaseBase<{
  operationHash: string
}>;
type TestCases = readonly TestCase[];

export const getTokenTransferQueryByTezosOperationTestCases: TestCases = [
  [
    'by Tezos operation hash',
    {
      operationHash: 'oocHgjpnSz9A8LRPekG4Fxspc2FW7wiBj7i3nMLpTaj4KQrSH2z',
      expectedQuery: 'query TokenTransfer { bridge_deposit(where: { l1_transaction: { operation_hash: { _eq: "oocHgjpnSz9A8LRPekG4Fxspc2FW7wiBj7i3nMLpTaj4KQrSH2z" } } }) { l1_transaction { level operation_hash amount ticket { token { id contract_address token_id } } l1_account l2_account timestamp inbox_message { type level index } } l2_transaction { level transaction_hash amount l2_token { id } timestamp } } bridge_withdrawal(where: { l1_transaction: { operation_hash: { _eq: "oocHgjpnSz9A8LRPekG4Fxspc2FW7wiBj7i3nMLpTaj4KQrSH2z" } } }) { l1_transaction { level operation_hash timestamp } l2_transaction { level transaction_hash amount l2_token { id ticket { token { id contract_address token_id } } } l1_account l2_account timestamp outbox_message { level index commitment { hash } proof } } } }'
    }
  ]
];
