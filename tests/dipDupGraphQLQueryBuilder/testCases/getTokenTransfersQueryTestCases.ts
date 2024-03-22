/* eslint-disable max-len */
import { PositiveTestCaseBase } from './testCase';
import type { GraphQLTransfersFilter } from '../../../src/bridgeDataProviders/dipDupBridgeDataProvider';

type TestCase = PositiveTestCaseBase<{
  offset: number,
  limit: number,
  filter?: GraphQLTransfersFilter
}>;
type TestCases = readonly TestCase[];

export const getTokenTransfersQueryTestCases: TestCases = [
  [
    'all, offset: 0, limit: 100',
    {
      offset: 0,
      limit: 100,
      expectedQuery: 'query TokenTransfers { bridge_operation( order_by: { created_at: desc }, offset: 0, limit: 100 ) { type status is_completed is_successful created_at updated_at deposit { l1_transaction { level operation_hash counter nonce amount ticket { token { type contract_address token_id } } l1_account l2_account timestamp inbox_message { type level index } } l2_transaction { level transaction_hash log_index amount l2_token { id } timestamp } } withdrawal { l1_transaction { level operation_hash counter nonce timestamp } l2_transaction { level transaction_hash log_index amount l2_token { id ticket { token { type contract_address token_id } } } l1_account l2_account timestamp outbox_message { level index commitment { hash } proof cemented_at } } } } }'
    }
  ],
  [
    'all, offset: 300, limit: 10',
    {
      offset: 300,
      limit: 10,
      expectedQuery: 'query TokenTransfers { bridge_operation( order_by: { created_at: desc }, offset: 300, limit: 10 ) { type status is_completed is_successful created_at updated_at deposit { l1_transaction { level operation_hash counter nonce amount ticket { token { type contract_address token_id } } l1_account l2_account timestamp inbox_message { type level index } } l2_transaction { level transaction_hash log_index amount l2_token { id } timestamp } } withdrawal { l1_transaction { level operation_hash counter nonce timestamp } l2_transaction { level transaction_hash log_index amount l2_token { id ticket { token { type contract_address token_id } } } l1_account l2_account timestamp outbox_message { level index commitment { hash } proof cemented_at } } } } }'
    }
  ],

  [
    'all, offset: 0, limit: 100 (with empty type filter)',
    {
      offset: 0,
      limit: 100,
      filter: {
        type: []
      },
      expectedQuery: 'query TokenTransfers { bridge_operation( where: { type: { _in: [] } }, order_by: { created_at: desc }, offset: 0, limit: 100 ) { type status is_completed is_successful created_at updated_at deposit { l1_transaction { level operation_hash counter nonce amount ticket { token { type contract_address token_id } } l1_account l2_account timestamp inbox_message { type level index } } l2_transaction { level transaction_hash log_index amount l2_token { id } timestamp } } withdrawal { l1_transaction { level operation_hash counter nonce timestamp } l2_transaction { level transaction_hash log_index amount l2_token { id ticket { token { type contract_address token_id } } } l1_account l2_account timestamp outbox_message { level index commitment { hash } proof cemented_at } } } } }'
    }
  ],
  [
    'all, offset: 0, limit: 100 (with empty status filter)',
    {
      offset: 0,
      limit: 100,
      filter: {
        status: []
      },
      expectedQuery: 'query TokenTransfers { bridge_operation( where: { status: { _in: [] } }, order_by: { created_at: desc }, offset: 0, limit: 100 ) { type status is_completed is_successful created_at updated_at deposit { l1_transaction { level operation_hash counter nonce amount ticket { token { type contract_address token_id } } l1_account l2_account timestamp inbox_message { type level index } } l2_transaction { level transaction_hash log_index amount l2_token { id } timestamp } } withdrawal { l1_transaction { level operation_hash counter nonce timestamp } l2_transaction { level transaction_hash log_index amount l2_token { id ticket { token { type contract_address token_id } } } l1_account l2_account timestamp outbox_message { level index commitment { hash } proof cemented_at } } } } }'
    }
  ],
  [
    'all, offset: 0, limit: 100 (with empty type and status filters)',
    {
      offset: 0,
      limit: 100,
      filter: {
        type: [],
        status: []
      },
      expectedQuery: 'query TokenTransfers { bridge_operation( where: { type: { _in: [] }, status: { _in: [] } }, order_by: { created_at: desc }, offset: 0, limit: 100 ) { type status is_completed is_successful created_at updated_at deposit { l1_transaction { level operation_hash counter nonce amount ticket { token { type contract_address token_id } } l1_account l2_account timestamp inbox_message { type level index } } l2_transaction { level transaction_hash log_index amount l2_token { id } timestamp } } withdrawal { l1_transaction { level operation_hash counter nonce timestamp } l2_transaction { level transaction_hash log_index amount l2_token { id ticket { token { type contract_address token_id } } } l1_account l2_account timestamp outbox_message { level index commitment { hash } proof cemented_at } } } } }'
    }
  ],

  [
    'all deposits, offset: 0, limit: 100',
    {
      offset: 0,
      limit: 100,
      filter: {
        type: ['deposit']
      },
      expectedQuery: 'query TokenTransfers { bridge_operation( where: { type: { _eq: "deposit" } }, order_by: { created_at: desc }, offset: 0, limit: 100 ) { type status is_completed is_successful created_at updated_at deposit { l1_transaction { level operation_hash counter nonce amount ticket { token { type contract_address token_id } } l1_account l2_account timestamp inbox_message { type level index } } l2_transaction { level transaction_hash log_index amount l2_token { id } timestamp } } withdrawal { l1_transaction { level operation_hash counter nonce timestamp } l2_transaction { level transaction_hash log_index amount l2_token { id ticket { token { type contract_address token_id } } } l1_account l2_account timestamp outbox_message { level index commitment { hash } proof cemented_at } } } } }'
    }
  ],
  [
    'all withdrawals, offset: 0, limit: 100',
    {
      offset: 0,
      limit: 100,
      filter: {
        type: ['withdrawal']
      },
      expectedQuery: 'query TokenTransfers { bridge_operation( where: { type: { _eq: "withdrawal" } }, order_by: { created_at: desc }, offset: 0, limit: 100 ) { type status is_completed is_successful created_at updated_at deposit { l1_transaction { level operation_hash counter nonce amount ticket { token { type contract_address token_id } } l1_account l2_account timestamp inbox_message { type level index } } l2_transaction { level transaction_hash log_index amount l2_token { id } timestamp } } withdrawal { l1_transaction { level operation_hash counter nonce timestamp } l2_transaction { level transaction_hash log_index amount l2_token { id ticket { token { type contract_address token_id } } } l1_account l2_account timestamp outbox_message { level index commitment { hash } proof cemented_at } } } } }'
    }
  ],
  [
    'all deposit and withdrawals, offset: 0, limit: 100',
    {
      offset: 0,
      limit: 100,
      filter: {
        type: ['deposit', 'withdrawal']
      },
      expectedQuery: 'query TokenTransfers { bridge_operation( where: { type: { _in: ["deposit","withdrawal"] } }, order_by: { created_at: desc }, offset: 0, limit: 100 ) { type status is_completed is_successful created_at updated_at deposit { l1_transaction { level operation_hash counter nonce amount ticket { token { type contract_address token_id } } l1_account l2_account timestamp inbox_message { type level index } } l2_transaction { level transaction_hash log_index amount l2_token { id } timestamp } } withdrawal { l1_transaction { level operation_hash counter nonce timestamp } l2_transaction { level transaction_hash log_index amount l2_token { id ticket { token { type contract_address token_id } } } l1_account l2_account timestamp outbox_message { level index commitment { hash } proof cemented_at } } } } }'
    }
  ],

  [
    'all created transfers, offset: 0, limit: 100',
    {
      offset: 0,
      limit: 100,
      filter: {
        status: ['Created']
      },
      expectedQuery: 'query TokenTransfers { bridge_operation( where: { status: { _eq: "Created" } }, order_by: { created_at: desc }, offset: 0, limit: 100 ) { type status is_completed is_successful created_at updated_at deposit { l1_transaction { level operation_hash counter nonce amount ticket { token { type contract_address token_id } } l1_account l2_account timestamp inbox_message { type level index } } l2_transaction { level transaction_hash log_index amount l2_token { id } timestamp } } withdrawal { l1_transaction { level operation_hash counter nonce timestamp } l2_transaction { level transaction_hash log_index amount l2_token { id ticket { token { type contract_address token_id } } } l1_account l2_account timestamp outbox_message { level index commitment { hash } proof cemented_at } } } } }'
    }
  ],
  [
    'all sealed transfers, offset: 0, limit: 100',
    {
      offset: 0,
      limit: 100,
      filter: {
        status: ['Sealed']
      },
      expectedQuery: 'query TokenTransfers { bridge_operation( where: { status: { _eq: "Sealed" } }, order_by: { created_at: desc }, offset: 0, limit: 100 ) { type status is_completed is_successful created_at updated_at deposit { l1_transaction { level operation_hash counter nonce amount ticket { token { type contract_address token_id } } l1_account l2_account timestamp inbox_message { type level index } } l2_transaction { level transaction_hash log_index amount l2_token { id } timestamp } } withdrawal { l1_transaction { level operation_hash counter nonce timestamp } l2_transaction { level transaction_hash log_index amount l2_token { id ticket { token { type contract_address token_id } } } l1_account l2_account timestamp outbox_message { level index commitment { hash } proof cemented_at } } } } }'
    }
  ],
  [
    'all finished transfers, offset: 0, limit: 100',
    {
      offset: 0,
      limit: 100,
      filter: {
        status: ['Finished']
      },
      expectedQuery: 'query TokenTransfers { bridge_operation( where: { status: { _eq: "Finished" } }, order_by: { created_at: desc }, offset: 0, limit: 100 ) { type status is_completed is_successful created_at updated_at deposit { l1_transaction { level operation_hash counter nonce amount ticket { token { type contract_address token_id } } l1_account l2_account timestamp inbox_message { type level index } } l2_transaction { level transaction_hash log_index amount l2_token { id } timestamp } } withdrawal { l1_transaction { level operation_hash counter nonce timestamp } l2_transaction { level transaction_hash log_index amount l2_token { id ticket { token { type contract_address token_id } } } l1_account l2_account timestamp outbox_message { level index commitment { hash } proof cemented_at } } } } }'
    }
  ],
  [
    'all failed transfers, offset: 0, limit: 100',
    {
      offset: 0,
      limit: 100,
      filter: {
        status: ['Failed']
      },
      expectedQuery: 'query TokenTransfers { bridge_operation( where: { status: { _eq: "Failed" } }, order_by: { created_at: desc }, offset: 0, limit: 100 ) { type status is_completed is_successful created_at updated_at deposit { l1_transaction { level operation_hash counter nonce amount ticket { token { type contract_address token_id } } l1_account l2_account timestamp inbox_message { type level index } } l2_transaction { level transaction_hash log_index amount l2_token { id } timestamp } } withdrawal { l1_transaction { level operation_hash counter nonce timestamp } l2_transaction { level transaction_hash log_index amount l2_token { id ticket { token { type contract_address token_id } } } l1_account l2_account timestamp outbox_message { level index commitment { hash } proof cemented_at } } } } }'
    }
  ],
  [
    'all created and finished transfers, offset: 0, limit: 100',
    {
      offset: 0,
      limit: 100,
      filter: {
        status: ['Created', 'Finished']
      },
      expectedQuery: 'query TokenTransfers { bridge_operation( where: { status: { _in: ["Created","Finished"] } }, order_by: { created_at: desc }, offset: 0, limit: 100 ) { type status is_completed is_successful created_at updated_at deposit { l1_transaction { level operation_hash counter nonce amount ticket { token { type contract_address token_id } } l1_account l2_account timestamp inbox_message { type level index } } l2_transaction { level transaction_hash log_index amount l2_token { id } timestamp } } withdrawal { l1_transaction { level operation_hash counter nonce timestamp } l2_transaction { level transaction_hash log_index amount l2_token { id ticket { token { type contract_address token_id } } } l1_account l2_account timestamp outbox_message { level index commitment { hash } proof cemented_at } } } } }'
    }
  ],
  [
    'all created, sealed and finished transfers, offset: 0, limit: 100',
    {
      offset: 0,
      limit: 100,
      filter: {
        status: ['Created', 'Sealed', 'Finished']
      },
      expectedQuery: 'query TokenTransfers { bridge_operation( where: { status: { _in: ["Created","Sealed","Finished"] } }, order_by: { created_at: desc }, offset: 0, limit: 100 ) { type status is_completed is_successful created_at updated_at deposit { l1_transaction { level operation_hash counter nonce amount ticket { token { type contract_address token_id } } l1_account l2_account timestamp inbox_message { type level index } } l2_transaction { level transaction_hash log_index amount l2_token { id } timestamp } } withdrawal { l1_transaction { level operation_hash counter nonce timestamp } l2_transaction { level transaction_hash log_index amount l2_token { id ticket { token { type contract_address token_id } } } l1_account l2_account timestamp outbox_message { level index commitment { hash } proof cemented_at } } } } }'
    }
  ],

  [
    'all created and finished deposits, offset: 0, limit: 100',
    {
      offset: 0,
      limit: 100,
      filter: {
        type: ['deposit'],
        status: ['Created', 'Finished']
      },
      expectedQuery: 'query TokenTransfers { bridge_operation( where: { type: { _eq: "deposit" }, status: { _in: ["Created","Finished"] } }, order_by: { created_at: desc }, offset: 0, limit: 100 ) { type status is_completed is_successful created_at updated_at deposit { l1_transaction { level operation_hash counter nonce amount ticket { token { type contract_address token_id } } l1_account l2_account timestamp inbox_message { type level index } } l2_transaction { level transaction_hash log_index amount l2_token { id } timestamp } } withdrawal { l1_transaction { level operation_hash counter nonce timestamp } l2_transaction { level transaction_hash log_index amount l2_token { id ticket { token { type contract_address token_id } } } l1_account l2_account timestamp outbox_message { level index commitment { hash } proof cemented_at } } } } }'
    }
  ],
  [
    'all created and sealed withdrawals, offset: 0, limit: 100',
    {
      offset: 0,
      limit: 100,
      filter: {
        type: ['withdrawal'],
        status: ['Created', 'Sealed']
      },
      expectedQuery: 'query TokenTransfers { bridge_operation( where: { type: { _eq: "withdrawal" }, status: { _in: ["Created","Sealed"] } }, order_by: { created_at: desc }, offset: 0, limit: 100 ) { type status is_completed is_successful created_at updated_at deposit { l1_transaction { level operation_hash counter nonce amount ticket { token { type contract_address token_id } } l1_account l2_account timestamp inbox_message { type level index } } l2_transaction { level transaction_hash log_index amount l2_token { id } timestamp } } withdrawal { l1_transaction { level operation_hash counter nonce timestamp } l2_transaction { level transaction_hash log_index amount l2_token { id ticket { token { type contract_address token_id } } } l1_account l2_account timestamp outbox_message { level index commitment { hash } proof cemented_at } } } } }'
    }
  ],
  [
    'all deposit and withdrawals with created and finished statuses, offset: 0, limit: 100',
    {
      offset: 0,
      limit: 100,
      filter: {
        type: ['deposit', 'withdrawal'],
        status: ['Created', 'Finished']
      },
      expectedQuery: 'query TokenTransfers { bridge_operation( where: { type: { _in: ["deposit","withdrawal"] }, status: { _in: ["Created","Finished"] } }, order_by: { created_at: desc }, offset: 0, limit: 100 ) { type status is_completed is_successful created_at updated_at deposit { l1_transaction { level operation_hash counter nonce amount ticket { token { type contract_address token_id } } l1_account l2_account timestamp inbox_message { type level index } } l2_transaction { level transaction_hash log_index amount l2_token { id } timestamp } } withdrawal { l1_transaction { level operation_hash counter nonce timestamp } l2_transaction { level transaction_hash log_index amount l2_token { id ticket { token { type contract_address token_id } } } l1_account l2_account timestamp outbox_message { level index commitment { hash } proof cemented_at } } } } }'
    }
  ],
];
