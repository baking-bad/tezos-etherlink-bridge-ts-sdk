/* eslint-disable max-len */
import { PositiveTestCaseBase } from './testCase';

type TestCase = PositiveTestCaseBase<{
  operationHash: string
}>;
type TestCases = readonly TestCase[];

const expectedQuery = 'query TokenTransfer { bridge_deposit(where: { l2_transaction: { transaction_hash: { _eq: "407671cc863e14b40c404ee9bd8f7281516f44d9b4785f006dc43b4f4ef8d2f1" } } }) { l1_transaction { level operation_hash amount ticket { token { type contract_address token_id } } l1_account l2_account timestamp inbox_message { type level index } } l2_transaction { level transaction_hash amount l2_token { id } timestamp } } bridge_withdrawal(where: { l2_transaction: { transaction_hash: { _eq: "407671cc863e14b40c404ee9bd8f7281516f44d9b4785f006dc43b4f4ef8d2f1" } } }) { l1_transaction { level operation_hash timestamp } l2_transaction { level transaction_hash amount l2_token { id tezos_ticket { token { type contract_address token_id } } } l1_account l2_account timestamp outbox_message { level index commitment { hash } proof } } } }';

export const getTokenTransferQueryByEtherlinkOperationTestCases: TestCases = [
  [
    'by Etherlink operation hash',
    {
      operationHash: '0x407671cc863e14b40c404ee9bd8f7281516f44d9b4785f006dc43b4f4ef8d2f1',
      expectedQuery
    }
  ]
];
