/* eslint-disable max-len */
import { PositiveTestCaseBase } from './testCase';

type TestCase = PositiveTestCaseBase<{
  operationHash: string,
  expectedQueries: readonly [deposit: string, withdrawal: string]
}, false>;
type TestCases = readonly TestCase[];

export const getTokenTransferSubscriptionTestCases: TestCases = [
  [
    'by Tezos operation hash',
    {
      operationHash: 'oocHgjpnSz9A8LRPekG4Fxspc2FW7wiBj7i3nMLpTaj4KQrSH2z',
      expectedQueries: [
        'subscription TokenTransfer { bridge_deposit(where: { l1_transaction: { operation_hash: { _eq: "oocHgjpnSz9A8LRPekG4Fxspc2FW7wiBj7i3nMLpTaj4KQrSH2z" } } }) { l1_transaction { level operation_hash amount ticket { token { type contract_address token_id } } l1_account l2_account timestamp inbox_message { type level index } } l2_transaction { level transaction_hash amount l2_token { id } timestamp } } }',
        'subscription TokenTransfer { bridge_withdrawal(where: { l1_transaction: { operation_hash: { _eq: "oocHgjpnSz9A8LRPekG4Fxspc2FW7wiBj7i3nMLpTaj4KQrSH2z" } } }) { l1_transaction { level operation_hash timestamp } l2_transaction { level transaction_hash amount l2_token { id ticket { token { type contract_address token_id } } } l1_account l2_account timestamp outbox_message { level index commitment { hash } proof } } } }',
      ]
    }
  ],
  [
    'by Etherlink operation hash',
    {
      operationHash: '0x407671cc863e14b40c404ee9bd8f7281516f44d9b4785f006dc43b4f4ef8d2f1',
      expectedQueries: [
        'subscription TokenTransfer { bridge_deposit(where: { l2_transaction: { transaction_hash: { _eq: "407671cc863e14b40c404ee9bd8f7281516f44d9b4785f006dc43b4f4ef8d2f1" } } }) { l1_transaction { level operation_hash amount ticket { token { type contract_address token_id } } l1_account l2_account timestamp inbox_message { type level index } } l2_transaction { level transaction_hash amount l2_token { id } timestamp } } }',
        'subscription TokenTransfer { bridge_withdrawal(where: { l2_transaction: { transaction_hash: { _eq: "407671cc863e14b40c404ee9bd8f7281516f44d9b4785f006dc43b4f4ef8d2f1" } } }) { l1_transaction { level operation_hash timestamp } l2_transaction { level transaction_hash amount l2_token { id ticket { token { type contract_address token_id } } } l1_account l2_account timestamp outbox_message { level index commitment { hash } proof } } } }'
      ]
    }
  ]
];
