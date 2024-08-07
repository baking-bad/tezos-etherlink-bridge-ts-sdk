/* eslint-disable max-len */
import { PositiveTestCaseBase } from './testCase';
import type { GraphQLTransfersFilter } from '../../../src/bridgeDataProviders/dipDupBridgeDataProvider';

type TestCase = PositiveTestCaseBase<{
  address: string | string[] | undefined | null,
  offset: number,
  limit: number,
  filter?: GraphQLTransfersFilter
}>;
type TestCases = readonly TestCase[];

export const getTokenTransfersQueryByAccountAddressesTestCases: TestCases = [
  [
    'transfers by one Tezos address (as string), offset: 0, limit: 100',
    {
      address: 'tz1M6VFkpALGXYoP5CvobR3z1pYu7KvirpMF',
      offset: 0,
      limit: 100,
      expectedQuery: 'query TokenTransfers { bridge_operation( where: { _or: [ { deposit: { l1_transaction: { l1_account: { _eq: "tz1M6VFkpALGXYoP5CvobR3z1pYu7KvirpMF" } } } } { withdrawal: { l2_transaction: { l1_account: { _eq: "tz1M6VFkpALGXYoP5CvobR3z1pYu7KvirpMF" } } } } ] }, order_by: { created_at: desc }, offset: 0, limit: 100 ) { type status is_completed is_successful created_at updated_at deposit { l1_transaction { level operation_hash counter nonce amount ticket { token { type contract_address token_id } } l1_account l2_account timestamp } l2_transaction { level transaction_hash log_index amount l2_token { id } timestamp } inbox_message { type level index } } withdrawal { l1_transaction { level operation_hash counter nonce timestamp } l2_transaction { level transaction_hash log_index amount l2_token { id ticket { token { type contract_address token_id } } } l1_account l2_account timestamp } outbox_message { level index commitment { hash } proof cemented_at cemented_level } } } }'
    }
  ],
  [
    'transfers by one Tezos address (as array of strings), offset: 0, limit: 100',
    {
      address: ['tz1M6VFkpALGXYoP5CvobR3z1pYu7KvirpMF'],
      offset: 0,
      limit: 100,
      expectedQuery: 'query TokenTransfers { bridge_operation( where: { _or: [ { deposit: { l1_transaction: { l1_account: { _eq: "tz1M6VFkpALGXYoP5CvobR3z1pYu7KvirpMF" } } } } { withdrawal: { l2_transaction: { l1_account: { _eq: "tz1M6VFkpALGXYoP5CvobR3z1pYu7KvirpMF" } } } } ] }, order_by: { created_at: desc }, offset: 0, limit: 100 ) { type status is_completed is_successful created_at updated_at deposit { l1_transaction { level operation_hash counter nonce amount ticket { token { type contract_address token_id } } l1_account l2_account timestamp } l2_transaction { level transaction_hash log_index amount l2_token { id } timestamp } inbox_message { type level index } } withdrawal { l1_transaction { level operation_hash counter nonce timestamp } l2_transaction { level transaction_hash log_index amount l2_token { id ticket { token { type contract_address token_id } } } l1_account l2_account timestamp } outbox_message { level index commitment { hash } proof cemented_at cemented_level } } } }'
    }
  ],
  [
    'transfers by one Etherlink address (as string), offset: 0, limit: 100',
    {
      address: '0x4A1819c83A78C948db50f80fED82721Dd0401c9b',
      offset: 0,
      limit: 100,
      expectedQuery: 'query TokenTransfers { bridge_operation( where: { _or: [ { deposit: { l1_transaction: { l2_account: { _eq: "4a1819c83a78c948db50f80fed82721dd0401c9b" } } } } { withdrawal: { l2_transaction: { l2_account: { _eq: "4a1819c83a78c948db50f80fed82721dd0401c9b" } } } } ] }, order_by: { created_at: desc }, offset: 0, limit: 100 ) { type status is_completed is_successful created_at updated_at deposit { l1_transaction { level operation_hash counter nonce amount ticket { token { type contract_address token_id } } l1_account l2_account timestamp } l2_transaction { level transaction_hash log_index amount l2_token { id } timestamp } inbox_message { type level index } } withdrawal { l1_transaction { level operation_hash counter nonce timestamp } l2_transaction { level transaction_hash log_index amount l2_token { id ticket { token { type contract_address token_id } } } l1_account l2_account timestamp } outbox_message { level index commitment { hash } proof cemented_at cemented_level } } } }'
    }
  ],
  [
    'transfers by one Etherlink address (as array of strings), offset: 0, limit: 100',
    {
      address: ['0x4A1819c83A78C948db50f80fED82721Dd0401c9b'],
      offset: 0,
      limit: 100,
      expectedQuery: 'query TokenTransfers { bridge_operation( where: { _or: [ { deposit: { l1_transaction: { l2_account: { _eq: "4a1819c83a78c948db50f80fed82721dd0401c9b" } } } } { withdrawal: { l2_transaction: { l2_account: { _eq: "4a1819c83a78c948db50f80fed82721dd0401c9b" } } } } ] }, order_by: { created_at: desc }, offset: 0, limit: 100 ) { type status is_completed is_successful created_at updated_at deposit { l1_transaction { level operation_hash counter nonce amount ticket { token { type contract_address token_id } } l1_account l2_account timestamp } l2_transaction { level transaction_hash log_index amount l2_token { id } timestamp } inbox_message { type level index } } withdrawal { l1_transaction { level operation_hash counter nonce timestamp } l2_transaction { level transaction_hash log_index amount l2_token { id ticket { token { type contract_address token_id } } } l1_account l2_account timestamp } outbox_message { level index commitment { hash } proof cemented_at cemented_level } } } }'
    }
  ],

  [
    'transfers by two Tezos addresses, offset: 0, limit: 100',
    {
      address: ['tz1M6VFkpALGXYoP5CvobR3z1pYu7KvirpMF', 'tz1YG6P2GTQKFpd9jeuESam2vg6aA9HHRkKo'],
      offset: 0,
      limit: 100,
      expectedQuery: 'query TokenTransfers { bridge_operation( where: { _or: [ { deposit: { l1_transaction: { l1_account: { _in: ["tz1M6VFkpALGXYoP5CvobR3z1pYu7KvirpMF","tz1YG6P2GTQKFpd9jeuESam2vg6aA9HHRkKo"] } } } } { withdrawal: { l2_transaction: { l1_account: { _in: ["tz1M6VFkpALGXYoP5CvobR3z1pYu7KvirpMF","tz1YG6P2GTQKFpd9jeuESam2vg6aA9HHRkKo"] } } } } ] }, order_by: { created_at: desc }, offset: 0, limit: 100 ) { type status is_completed is_successful created_at updated_at deposit { l1_transaction { level operation_hash counter nonce amount ticket { token { type contract_address token_id } } l1_account l2_account timestamp } l2_transaction { level transaction_hash log_index amount l2_token { id } timestamp } inbox_message { type level index } } withdrawal { l1_transaction { level operation_hash counter nonce timestamp } l2_transaction { level transaction_hash log_index amount l2_token { id ticket { token { type contract_address token_id } } } l1_account l2_account timestamp } outbox_message { level index commitment { hash } proof cemented_at cemented_level } } } }'
    }
  ],
  [
    'transfers by two Etherlink addresses, offset: 0, limit: 100',
    {
      address: ['0x4A1819c83A78C948db50f80fED82721Dd0401c9b', '0xBefD2C6fFC36249ebEbd21d6DF6376ecF3BAc448'],
      offset: 0,
      limit: 100,
      expectedQuery: 'query TokenTransfers { bridge_operation( where: { _or: [ { deposit: { l1_transaction: { l2_account: { _in: ["4a1819c83a78c948db50f80fed82721dd0401c9b","befd2c6ffc36249ebebd21d6df6376ecf3bac448"] } } } } { withdrawal: { l2_transaction: { l2_account: { _in: ["4a1819c83a78c948db50f80fed82721dd0401c9b","befd2c6ffc36249ebebd21d6df6376ecf3bac448"] } } } } ] }, order_by: { created_at: desc }, offset: 0, limit: 100 ) { type status is_completed is_successful created_at updated_at deposit { l1_transaction { level operation_hash counter nonce amount ticket { token { type contract_address token_id } } l1_account l2_account timestamp } l2_transaction { level transaction_hash log_index amount l2_token { id } timestamp } inbox_message { type level index } } withdrawal { l1_transaction { level operation_hash counter nonce timestamp } l2_transaction { level transaction_hash log_index amount l2_token { id ticket { token { type contract_address token_id } } } l1_account l2_account timestamp } outbox_message { level index commitment { hash } proof cemented_at cemented_level } } } }'
    }
  ],
  [
    'transfers by three Tezos addresses, offset: 0, limit: 100',
    {
      address: ['tz1M6VFkpALGXYoP5CvobR3z1pYu7KvirpMF', 'tz1YG6P2GTQKFpd9jeuESam2vg6aA9HHRkKo', 'tz1N96ka7u5cKVbrLdK6wa6KyLoAgdfDzKns'],
      offset: 0,
      limit: 100,
      expectedQuery: 'query TokenTransfers { bridge_operation( where: { _or: [ { deposit: { l1_transaction: { l1_account: { _in: ["tz1M6VFkpALGXYoP5CvobR3z1pYu7KvirpMF","tz1YG6P2GTQKFpd9jeuESam2vg6aA9HHRkKo","tz1N96ka7u5cKVbrLdK6wa6KyLoAgdfDzKns"] } } } } { withdrawal: { l2_transaction: { l1_account: { _in: ["tz1M6VFkpALGXYoP5CvobR3z1pYu7KvirpMF","tz1YG6P2GTQKFpd9jeuESam2vg6aA9HHRkKo","tz1N96ka7u5cKVbrLdK6wa6KyLoAgdfDzKns"] } } } } ] }, order_by: { created_at: desc }, offset: 0, limit: 100 ) { type status is_completed is_successful created_at updated_at deposit { l1_transaction { level operation_hash counter nonce amount ticket { token { type contract_address token_id } } l1_account l2_account timestamp } l2_transaction { level transaction_hash log_index amount l2_token { id } timestamp } inbox_message { type level index } } withdrawal { l1_transaction { level operation_hash counter nonce timestamp } l2_transaction { level transaction_hash log_index amount l2_token { id ticket { token { type contract_address token_id } } } l1_account l2_account timestamp } outbox_message { level index commitment { hash } proof cemented_at cemented_level } } } }'
    }
  ],
  [
    'transfers by three Etherlink addresses, offset: 0, limit: 100',
    {
      address: ['0x4A1819c83A78C948db50f80fED82721Dd0401c9b', '0xBefD2C6fFC36249ebEbd21d6DF6376ecF3BAc448', '0xce912ad4F73dBC149110091044a8f58Fd17B2b53'],
      offset: 0,
      limit: 100,
      expectedQuery: 'query TokenTransfers { bridge_operation( where: { _or: [ { deposit: { l1_transaction: { l2_account: { _in: ["4a1819c83a78c948db50f80fed82721dd0401c9b","befd2c6ffc36249ebebd21d6df6376ecf3bac448","ce912ad4f73dbc149110091044a8f58fd17b2b53"] } } } } { withdrawal: { l2_transaction: { l2_account: { _in: ["4a1819c83a78c948db50f80fed82721dd0401c9b","befd2c6ffc36249ebebd21d6df6376ecf3bac448","ce912ad4f73dbc149110091044a8f58fd17b2b53"] } } } } ] }, order_by: { created_at: desc }, offset: 0, limit: 100 ) { type status is_completed is_successful created_at updated_at deposit { l1_transaction { level operation_hash counter nonce amount ticket { token { type contract_address token_id } } l1_account l2_account timestamp } l2_transaction { level transaction_hash log_index amount l2_token { id } timestamp } inbox_message { type level index } } withdrawal { l1_transaction { level operation_hash counter nonce timestamp } l2_transaction { level transaction_hash log_index amount l2_token { id ticket { token { type contract_address token_id } } } l1_account l2_account timestamp } outbox_message { level index commitment { hash } proof cemented_at cemented_level } } } }'
    }
  ],

  [
    'transfers by Tezos address and Etherlink address, offset: 0, limit: 100',
    {
      address: ['tz1M6VFkpALGXYoP5CvobR3z1pYu7KvirpMF', '0x4A1819c83A78C948db50f80fED82721Dd0401c9b'],
      offset: 0,
      limit: 100,
      expectedQuery: 'query TokenTransfers { bridge_operation( where: { _or: [ { deposit: { l1_transaction: { _or: [ { l1_account: { _eq: "tz1M6VFkpALGXYoP5CvobR3z1pYu7KvirpMF" } }{ l2_account: { _eq: "4a1819c83a78c948db50f80fed82721dd0401c9b" } } ] } } } { withdrawal: { l2_transaction: { _or: [ { l1_account: { _eq: "tz1M6VFkpALGXYoP5CvobR3z1pYu7KvirpMF" } }{ l2_account: { _eq: "4a1819c83a78c948db50f80fed82721dd0401c9b" } } ] } } } ] }, order_by: { created_at: desc }, offset: 0, limit: 100 ) { type status is_completed is_successful created_at updated_at deposit { l1_transaction { level operation_hash counter nonce amount ticket { token { type contract_address token_id } } l1_account l2_account timestamp } l2_transaction { level transaction_hash log_index amount l2_token { id } timestamp } inbox_message { type level index } } withdrawal { l1_transaction { level operation_hash counter nonce timestamp } l2_transaction { level transaction_hash log_index amount l2_token { id ticket { token { type contract_address token_id } } } l1_account l2_account timestamp } outbox_message { level index commitment { hash } proof cemented_at cemented_level } } } }'
    }
  ],
  [
    'transfers by two Tezos addresses and two Etherlink addresses, offset: 0, limit: 100',
    {
      address: [
        'tz1M6VFkpALGXYoP5CvobR3z1pYu7KvirpMF',
        '0x4A1819c83A78C948db50f80fED82721Dd0401c9b',
        '0xBefD2C6fFC36249ebEbd21d6DF6376ecF3BAc448',
        'tz1YG6P2GTQKFpd9jeuESam2vg6aA9HHRkKo'
      ],
      offset: 0,
      limit: 100,
      expectedQuery: 'query TokenTransfers { bridge_operation( where: { _or: [ { deposit: { l1_transaction: { _or: [ { l1_account: { _in: ["tz1M6VFkpALGXYoP5CvobR3z1pYu7KvirpMF","tz1YG6P2GTQKFpd9jeuESam2vg6aA9HHRkKo"] } }{ l2_account: { _in: ["4a1819c83a78c948db50f80fed82721dd0401c9b","befd2c6ffc36249ebebd21d6df6376ecf3bac448"] } } ] } } } { withdrawal: { l2_transaction: { _or: [ { l1_account: { _in: ["tz1M6VFkpALGXYoP5CvobR3z1pYu7KvirpMF","tz1YG6P2GTQKFpd9jeuESam2vg6aA9HHRkKo"] } }{ l2_account: { _in: ["4a1819c83a78c948db50f80fed82721dd0401c9b","befd2c6ffc36249ebebd21d6df6376ecf3bac448"] } } ] } } } ] }, order_by: { created_at: desc }, offset: 0, limit: 100 ) { type status is_completed is_successful created_at updated_at deposit { l1_transaction { level operation_hash counter nonce amount ticket { token { type contract_address token_id } } l1_account l2_account timestamp } l2_transaction { level transaction_hash log_index amount l2_token { id } timestamp } inbox_message { type level index } } withdrawal { l1_transaction { level operation_hash counter nonce timestamp } l2_transaction { level transaction_hash log_index amount l2_token { id ticket { token { type contract_address token_id } } } l1_account l2_account timestamp } outbox_message { level index commitment { hash } proof cemented_at cemented_level } } } }'
    }
  ],
  [
    'transfers by three Tezos addresses and three Etherlink addresses, offset: 0, limit: 100',
    {
      address: [
        'tz1M6VFkpALGXYoP5CvobR3z1pYu7KvirpMF',
        '0x4A1819c83A78C948db50f80fED82721Dd0401c9b',
        '0xBefD2C6fFC36249ebEbd21d6DF6376ecF3BAc448',
        'tz1YG6P2GTQKFpd9jeuESam2vg6aA9HHRkKo',
        'tz1N96ka7u5cKVbrLdK6wa6KyLoAgdfDzKns',
        '0xce912ad4F73dBC149110091044a8f58Fd17B2b53'
      ],
      offset: 0,
      limit: 100,
      expectedQuery: 'query TokenTransfers { bridge_operation( where: { _or: [ { deposit: { l1_transaction: { _or: [ { l1_account: { _in: ["tz1M6VFkpALGXYoP5CvobR3z1pYu7KvirpMF","tz1YG6P2GTQKFpd9jeuESam2vg6aA9HHRkKo","tz1N96ka7u5cKVbrLdK6wa6KyLoAgdfDzKns"] } }{ l2_account: { _in: ["4a1819c83a78c948db50f80fed82721dd0401c9b","befd2c6ffc36249ebebd21d6df6376ecf3bac448","ce912ad4f73dbc149110091044a8f58fd17b2b53"] } } ] } } } { withdrawal: { l2_transaction: { _or: [ { l1_account: { _in: ["tz1M6VFkpALGXYoP5CvobR3z1pYu7KvirpMF","tz1YG6P2GTQKFpd9jeuESam2vg6aA9HHRkKo","tz1N96ka7u5cKVbrLdK6wa6KyLoAgdfDzKns"] } }{ l2_account: { _in: ["4a1819c83a78c948db50f80fed82721dd0401c9b","befd2c6ffc36249ebebd21d6df6376ecf3bac448","ce912ad4f73dbc149110091044a8f58fd17b2b53"] } } ] } } } ] }, order_by: { created_at: desc }, offset: 0, limit: 100 ) { type status is_completed is_successful created_at updated_at deposit { l1_transaction { level operation_hash counter nonce amount ticket { token { type contract_address token_id } } l1_account l2_account timestamp } l2_transaction { level transaction_hash log_index amount l2_token { id } timestamp } inbox_message { type level index } } withdrawal { l1_transaction { level operation_hash counter nonce timestamp } l2_transaction { level transaction_hash log_index amount l2_token { id ticket { token { type contract_address token_id } } } l1_account l2_account timestamp } outbox_message { level index commitment { hash } proof cemented_at cemented_level } } } }'
    }
  ],

  [
    'transfers by Tezos address and Etherlink address, offset: 0, limit: 100 (with empty type filter)',
    {
      address: ['tz1M6VFkpALGXYoP5CvobR3z1pYu7KvirpMF', '0x4A1819c83A78C948db50f80fED82721Dd0401c9b'],
      offset: 0,
      limit: 100,
      filter: {
        type: []
      },
      expectedQuery: 'query TokenTransfers { bridge_operation( where: { type: { _in: [] }, _or: [ { deposit: { l1_transaction: { _or: [ { l1_account: { _eq: "tz1M6VFkpALGXYoP5CvobR3z1pYu7KvirpMF" } }{ l2_account: { _eq: "4a1819c83a78c948db50f80fed82721dd0401c9b" } } ] } } } { withdrawal: { l2_transaction: { _or: [ { l1_account: { _eq: "tz1M6VFkpALGXYoP5CvobR3z1pYu7KvirpMF" } }{ l2_account: { _eq: "4a1819c83a78c948db50f80fed82721dd0401c9b" } } ] } } } ] }, order_by: { created_at: desc }, offset: 0, limit: 100 ) { type status is_completed is_successful created_at updated_at deposit { l1_transaction { level operation_hash counter nonce amount ticket { token { type contract_address token_id } } l1_account l2_account timestamp } l2_transaction { level transaction_hash log_index amount l2_token { id } timestamp } inbox_message { type level index } } withdrawal { l1_transaction { level operation_hash counter nonce timestamp } l2_transaction { level transaction_hash log_index amount l2_token { id ticket { token { type contract_address token_id } } } l1_account l2_account timestamp } outbox_message { level index commitment { hash } proof cemented_at cemented_level } } } }'
    }
  ],
  [
    'transfers by Tezos address and Etherlink address, offset: 0, limit: 100 (with empty status filter)',
    {
      address: ['tz1M6VFkpALGXYoP5CvobR3z1pYu7KvirpMF', '0x4A1819c83A78C948db50f80fED82721Dd0401c9b'],
      offset: 0,
      limit: 100,
      filter: {
        status: []
      },
      expectedQuery: 'query TokenTransfers { bridge_operation( where: { status: { _in: [] }, _or: [ { deposit: { l1_transaction: { _or: [ { l1_account: { _eq: "tz1M6VFkpALGXYoP5CvobR3z1pYu7KvirpMF" } }{ l2_account: { _eq: "4a1819c83a78c948db50f80fed82721dd0401c9b" } } ] } } } { withdrawal: { l2_transaction: { _or: [ { l1_account: { _eq: "tz1M6VFkpALGXYoP5CvobR3z1pYu7KvirpMF" } }{ l2_account: { _eq: "4a1819c83a78c948db50f80fed82721dd0401c9b" } } ] } } } ] }, order_by: { created_at: desc }, offset: 0, limit: 100 ) { type status is_completed is_successful created_at updated_at deposit { l1_transaction { level operation_hash counter nonce amount ticket { token { type contract_address token_id } } l1_account l2_account timestamp } l2_transaction { level transaction_hash log_index amount l2_token { id } timestamp } inbox_message { type level index } } withdrawal { l1_transaction { level operation_hash counter nonce timestamp } l2_transaction { level transaction_hash log_index amount l2_token { id ticket { token { type contract_address token_id } } } l1_account l2_account timestamp } outbox_message { level index commitment { hash } proof cemented_at cemented_level } } } }'
    }
  ],
  [
    'transfers by Tezos address and Etherlink address, offset: 0, limit: 100 (with empty type and status filters)',
    {
      address: ['tz1M6VFkpALGXYoP5CvobR3z1pYu7KvirpMF', '0x4A1819c83A78C948db50f80fED82721Dd0401c9b'],
      offset: 0,
      limit: 100,
      filter: {
        type: [],
        status: []
      },
      expectedQuery: 'query TokenTransfers { bridge_operation( where: { type: { _in: [] }, status: { _in: [] }, _or: [ { deposit: { l1_transaction: { _or: [ { l1_account: { _eq: "tz1M6VFkpALGXYoP5CvobR3z1pYu7KvirpMF" } }{ l2_account: { _eq: "4a1819c83a78c948db50f80fed82721dd0401c9b" } } ] } } } { withdrawal: { l2_transaction: { _or: [ { l1_account: { _eq: "tz1M6VFkpALGXYoP5CvobR3z1pYu7KvirpMF" } }{ l2_account: { _eq: "4a1819c83a78c948db50f80fed82721dd0401c9b" } } ] } } } ] }, order_by: { created_at: desc }, offset: 0, limit: 100 ) { type status is_completed is_successful created_at updated_at deposit { l1_transaction { level operation_hash counter nonce amount ticket { token { type contract_address token_id } } l1_account l2_account timestamp } l2_transaction { level transaction_hash log_index amount l2_token { id } timestamp } inbox_message { type level index } } withdrawal { l1_transaction { level operation_hash counter nonce timestamp } l2_transaction { level transaction_hash log_index amount l2_token { id ticket { token { type contract_address token_id } } } l1_account l2_account timestamp } outbox_message { level index commitment { hash } proof cemented_at cemented_level } } } }'
    }
  ],

  [
    'deposits by Tezos address and Etherlink address, offset: 0, limit: 100',
    {
      address: ['tz1M6VFkpALGXYoP5CvobR3z1pYu7KvirpMF', '0x4A1819c83A78C948db50f80fED82721Dd0401c9b'],
      offset: 0,
      limit: 100,
      filter: {
        type: ['deposit']
      },
      expectedQuery: 'query TokenTransfers { bridge_operation( where: { type: { _eq: "deposit" }, _or: [ { deposit: { l1_transaction: { _or: [ { l1_account: { _eq: "tz1M6VFkpALGXYoP5CvobR3z1pYu7KvirpMF" } }{ l2_account: { _eq: "4a1819c83a78c948db50f80fed82721dd0401c9b" } } ] } } } { withdrawal: { l2_transaction: { _or: [ { l1_account: { _eq: "tz1M6VFkpALGXYoP5CvobR3z1pYu7KvirpMF" } }{ l2_account: { _eq: "4a1819c83a78c948db50f80fed82721dd0401c9b" } } ] } } } ] }, order_by: { created_at: desc }, offset: 0, limit: 100 ) { type status is_completed is_successful created_at updated_at deposit { l1_transaction { level operation_hash counter nonce amount ticket { token { type contract_address token_id } } l1_account l2_account timestamp } l2_transaction { level transaction_hash log_index amount l2_token { id } timestamp } inbox_message { type level index } } withdrawal { l1_transaction { level operation_hash counter nonce timestamp } l2_transaction { level transaction_hash log_index amount l2_token { id ticket { token { type contract_address token_id } } } l1_account l2_account timestamp } outbox_message { level index commitment { hash } proof cemented_at cemented_level } } } }'
    }
  ],
  [
    'withdrawals by Tezos address and Etherlink address, offset: 0, limit: 100',
    {
      address: ['tz1M6VFkpALGXYoP5CvobR3z1pYu7KvirpMF', '0x4A1819c83A78C948db50f80fED82721Dd0401c9b'],
      offset: 0,
      limit: 100,
      filter: {
        type: ['withdrawal']
      },
      expectedQuery: 'query TokenTransfers { bridge_operation( where: { type: { _eq: "withdrawal" }, _or: [ { deposit: { l1_transaction: { _or: [ { l1_account: { _eq: "tz1M6VFkpALGXYoP5CvobR3z1pYu7KvirpMF" } }{ l2_account: { _eq: "4a1819c83a78c948db50f80fed82721dd0401c9b" } } ] } } } { withdrawal: { l2_transaction: { _or: [ { l1_account: { _eq: "tz1M6VFkpALGXYoP5CvobR3z1pYu7KvirpMF" } }{ l2_account: { _eq: "4a1819c83a78c948db50f80fed82721dd0401c9b" } } ] } } } ] }, order_by: { created_at: desc }, offset: 0, limit: 100 ) { type status is_completed is_successful created_at updated_at deposit { l1_transaction { level operation_hash counter nonce amount ticket { token { type contract_address token_id } } l1_account l2_account timestamp } l2_transaction { level transaction_hash log_index amount l2_token { id } timestamp } inbox_message { type level index } } withdrawal { l1_transaction { level operation_hash counter nonce timestamp } l2_transaction { level transaction_hash log_index amount l2_token { id ticket { token { type contract_address token_id } } } l1_account l2_account timestamp } outbox_message { level index commitment { hash } proof cemented_at cemented_level } } } }'
    }
  ],
  [
    'deposit and withdrawals by Tezos address and Etherlink address, offset: 0, limit: 100',
    {
      address: ['tz1M6VFkpALGXYoP5CvobR3z1pYu7KvirpMF', '0x4A1819c83A78C948db50f80fED82721Dd0401c9b'],
      offset: 0,
      limit: 100,
      filter: {
        type: ['deposit', 'withdrawal']
      },
      expectedQuery: 'query TokenTransfers { bridge_operation( where: { type: { _in: ["deposit","withdrawal"] }, _or: [ { deposit: { l1_transaction: { _or: [ { l1_account: { _eq: "tz1M6VFkpALGXYoP5CvobR3z1pYu7KvirpMF" } }{ l2_account: { _eq: "4a1819c83a78c948db50f80fed82721dd0401c9b" } } ] } } } { withdrawal: { l2_transaction: { _or: [ { l1_account: { _eq: "tz1M6VFkpALGXYoP5CvobR3z1pYu7KvirpMF" } }{ l2_account: { _eq: "4a1819c83a78c948db50f80fed82721dd0401c9b" } } ] } } } ] }, order_by: { created_at: desc }, offset: 0, limit: 100 ) { type status is_completed is_successful created_at updated_at deposit { l1_transaction { level operation_hash counter nonce amount ticket { token { type contract_address token_id } } l1_account l2_account timestamp } l2_transaction { level transaction_hash log_index amount l2_token { id } timestamp } inbox_message { type level index } } withdrawal { l1_transaction { level operation_hash counter nonce timestamp } l2_transaction { level transaction_hash log_index amount l2_token { id ticket { token { type contract_address token_id } } } l1_account l2_account timestamp } outbox_message { level index commitment { hash } proof cemented_at cemented_level } } } }'
    }
  ],

  [
    'created transfers by Tezos address and Etherlink address, offset: 0, limit: 100',
    {
      address: ['tz1M6VFkpALGXYoP5CvobR3z1pYu7KvirpMF', '0x4A1819c83A78C948db50f80fED82721Dd0401c9b'],
      offset: 0,
      limit: 100,
      filter: {
        status: ['CREATED']
      },
      expectedQuery: 'query TokenTransfers { bridge_operation( where: { status: { _eq: "CREATED" }, _or: [ { deposit: { l1_transaction: { _or: [ { l1_account: { _eq: "tz1M6VFkpALGXYoP5CvobR3z1pYu7KvirpMF" } }{ l2_account: { _eq: "4a1819c83a78c948db50f80fed82721dd0401c9b" } } ] } } } { withdrawal: { l2_transaction: { _or: [ { l1_account: { _eq: "tz1M6VFkpALGXYoP5CvobR3z1pYu7KvirpMF" } }{ l2_account: { _eq: "4a1819c83a78c948db50f80fed82721dd0401c9b" } } ] } } } ] }, order_by: { created_at: desc }, offset: 0, limit: 100 ) { type status is_completed is_successful created_at updated_at deposit { l1_transaction { level operation_hash counter nonce amount ticket { token { type contract_address token_id } } l1_account l2_account timestamp } l2_transaction { level transaction_hash log_index amount l2_token { id } timestamp } inbox_message { type level index } } withdrawal { l1_transaction { level operation_hash counter nonce timestamp } l2_transaction { level transaction_hash log_index amount l2_token { id ticket { token { type contract_address token_id } } } l1_account l2_account timestamp } outbox_message { level index commitment { hash } proof cemented_at cemented_level } } } }'
    }
  ],
  [
    'sealed transfers by Tezos address and Etherlink address, offset: 0, limit: 100',
    {
      address: ['tz1M6VFkpALGXYoP5CvobR3z1pYu7KvirpMF', '0x4A1819c83A78C948db50f80fED82721Dd0401c9b'],
      offset: 0,
      limit: 100,
      filter: {
        status: ['SEALED']
      },
      expectedQuery: 'query TokenTransfers { bridge_operation( where: { status: { _eq: "SEALED" }, _or: [ { deposit: { l1_transaction: { _or: [ { l1_account: { _eq: "tz1M6VFkpALGXYoP5CvobR3z1pYu7KvirpMF" } }{ l2_account: { _eq: "4a1819c83a78c948db50f80fed82721dd0401c9b" } } ] } } } { withdrawal: { l2_transaction: { _or: [ { l1_account: { _eq: "tz1M6VFkpALGXYoP5CvobR3z1pYu7KvirpMF" } }{ l2_account: { _eq: "4a1819c83a78c948db50f80fed82721dd0401c9b" } } ] } } } ] }, order_by: { created_at: desc }, offset: 0, limit: 100 ) { type status is_completed is_successful created_at updated_at deposit { l1_transaction { level operation_hash counter nonce amount ticket { token { type contract_address token_id } } l1_account l2_account timestamp } l2_transaction { level transaction_hash log_index amount l2_token { id } timestamp } inbox_message { type level index } } withdrawal { l1_transaction { level operation_hash counter nonce timestamp } l2_transaction { level transaction_hash log_index amount l2_token { id ticket { token { type contract_address token_id } } } l1_account l2_account timestamp } outbox_message { level index commitment { hash } proof cemented_at cemented_level } } } }'
    }
  ],
  [
    'finished transfers by Tezos address and Etherlink address, offset: 0, limit: 100',
    {
      address: ['tz1M6VFkpALGXYoP5CvobR3z1pYu7KvirpMF', '0x4A1819c83A78C948db50f80fED82721Dd0401c9b'],
      offset: 0,
      limit: 100,
      filter: {
        status: ['FINISHED']
      },
      expectedQuery: 'query TokenTransfers { bridge_operation( where: { status: { _eq: "FINISHED" }, _or: [ { deposit: { l1_transaction: { _or: [ { l1_account: { _eq: "tz1M6VFkpALGXYoP5CvobR3z1pYu7KvirpMF" } }{ l2_account: { _eq: "4a1819c83a78c948db50f80fed82721dd0401c9b" } } ] } } } { withdrawal: { l2_transaction: { _or: [ { l1_account: { _eq: "tz1M6VFkpALGXYoP5CvobR3z1pYu7KvirpMF" } }{ l2_account: { _eq: "4a1819c83a78c948db50f80fed82721dd0401c9b" } } ] } } } ] }, order_by: { created_at: desc }, offset: 0, limit: 100 ) { type status is_completed is_successful created_at updated_at deposit { l1_transaction { level operation_hash counter nonce amount ticket { token { type contract_address token_id } } l1_account l2_account timestamp } l2_transaction { level transaction_hash log_index amount l2_token { id } timestamp } inbox_message { type level index } } withdrawal { l1_transaction { level operation_hash counter nonce timestamp } l2_transaction { level transaction_hash log_index amount l2_token { id ticket { token { type contract_address token_id } } } l1_account l2_account timestamp } outbox_message { level index commitment { hash } proof cemented_at cemented_level } } } }'
    }
  ],
  [
    'common failed transfers by Tezos address and Etherlink address, offset: 0, limit: 100',
    {
      address: ['tz1M6VFkpALGXYoP5CvobR3z1pYu7KvirpMF', '0x4A1819c83A78C948db50f80fED82721Dd0401c9b'],
      offset: 0,
      limit: 100,
      filter: {
        status: ['FAILED']
      },
      expectedQuery: 'query TokenTransfers { bridge_operation( where: { status: { _eq: "FAILED" }, _or: [ { deposit: { l1_transaction: { _or: [ { l1_account: { _eq: "tz1M6VFkpALGXYoP5CvobR3z1pYu7KvirpMF" } }{ l2_account: { _eq: "4a1819c83a78c948db50f80fed82721dd0401c9b" } } ] } } } { withdrawal: { l2_transaction: { _or: [ { l1_account: { _eq: "tz1M6VFkpALGXYoP5CvobR3z1pYu7KvirpMF" } }{ l2_account: { _eq: "4a1819c83a78c948db50f80fed82721dd0401c9b" } } ] } } } ] }, order_by: { created_at: desc }, offset: 0, limit: 100 ) { type status is_completed is_successful created_at updated_at deposit { l1_transaction { level operation_hash counter nonce amount ticket { token { type contract_address token_id } } l1_account l2_account timestamp } l2_transaction { level transaction_hash log_index amount l2_token { id } timestamp } inbox_message { type level index } } withdrawal { l1_transaction { level operation_hash counter nonce timestamp } l2_transaction { level transaction_hash log_index amount l2_token { id ticket { token { type contract_address token_id } } } l1_account l2_account timestamp } outbox_message { level index commitment { hash } proof cemented_at cemented_level } } } }'
    }
  ],
  [
    'all failed transfers by Tezos address and Etherlink address, offset: 0, limit: 100',
    {
      address: ['tz1M6VFkpALGXYoP5CvobR3z1pYu7KvirpMF', '0x4A1819c83A78C948db50f80fED82721Dd0401c9b'],
      offset: 0,
      limit: 100,
      filter: {
        status: ['FAILED', 'FAILED_INVALID_ROUTING_INFO_REVERTABLE', 'FAILED_INVALID_ROUTING_PROXY_NOT_WHITELISTED', 'FAILED_INVALID_ROUTING_PROXY_EMPTY_PROXY', 'FAILED_INVALID_ROUTING_INVALID_PROXY_ADDRESS', 'FAILED_OUTBOX_EXPIRED', 'FAILED_INBOX_MATCHING_TIMEOUT']
      },
      expectedQuery: 'query TokenTransfers { bridge_operation( where: { status: { _in: ["FAILED","FAILED_INVALID_ROUTING_INFO_REVERTABLE","FAILED_INVALID_ROUTING_PROXY_NOT_WHITELISTED","FAILED_INVALID_ROUTING_PROXY_EMPTY_PROXY","FAILED_INVALID_ROUTING_INVALID_PROXY_ADDRESS","FAILED_OUTBOX_EXPIRED","FAILED_INBOX_MATCHING_TIMEOUT"] }, _or: [ { deposit: { l1_transaction: { _or: [ { l1_account: { _eq: "tz1M6VFkpALGXYoP5CvobR3z1pYu7KvirpMF" } }{ l2_account: { _eq: "4a1819c83a78c948db50f80fed82721dd0401c9b" } } ] } } } { withdrawal: { l2_transaction: { _or: [ { l1_account: { _eq: "tz1M6VFkpALGXYoP5CvobR3z1pYu7KvirpMF" } }{ l2_account: { _eq: "4a1819c83a78c948db50f80fed82721dd0401c9b" } } ] } } } ] }, order_by: { created_at: desc }, offset: 0, limit: 100 ) { type status is_completed is_successful created_at updated_at deposit { l1_transaction { level operation_hash counter nonce amount ticket { token { type contract_address token_id } } l1_account l2_account timestamp } l2_transaction { level transaction_hash log_index amount l2_token { id } timestamp } inbox_message { type level index } } withdrawal { l1_transaction { level operation_hash counter nonce timestamp } l2_transaction { level transaction_hash log_index amount l2_token { id ticket { token { type contract_address token_id } } } l1_account l2_account timestamp } outbox_message { level index commitment { hash } proof cemented_at cemented_level } } } }'
    }
  ],
  [
    'created and finished transfers by Tezos address and Etherlink address, offset: 0, limit: 100',
    {
      address: ['tz1M6VFkpALGXYoP5CvobR3z1pYu7KvirpMF', '0x4A1819c83A78C948db50f80fED82721Dd0401c9b'],
      offset: 0,
      limit: 100,
      filter: {
        status: ['CREATED', 'FINISHED']
      },
      expectedQuery: 'query TokenTransfers { bridge_operation( where: { status: { _in: ["CREATED","FINISHED"] }, _or: [ { deposit: { l1_transaction: { _or: [ { l1_account: { _eq: "tz1M6VFkpALGXYoP5CvobR3z1pYu7KvirpMF" } }{ l2_account: { _eq: "4a1819c83a78c948db50f80fed82721dd0401c9b" } } ] } } } { withdrawal: { l2_transaction: { _or: [ { l1_account: { _eq: "tz1M6VFkpALGXYoP5CvobR3z1pYu7KvirpMF" } }{ l2_account: { _eq: "4a1819c83a78c948db50f80fed82721dd0401c9b" } } ] } } } ] }, order_by: { created_at: desc }, offset: 0, limit: 100 ) { type status is_completed is_successful created_at updated_at deposit { l1_transaction { level operation_hash counter nonce amount ticket { token { type contract_address token_id } } l1_account l2_account timestamp } l2_transaction { level transaction_hash log_index amount l2_token { id } timestamp } inbox_message { type level index } } withdrawal { l1_transaction { level operation_hash counter nonce timestamp } l2_transaction { level transaction_hash log_index amount l2_token { id ticket { token { type contract_address token_id } } } l1_account l2_account timestamp } outbox_message { level index commitment { hash } proof cemented_at cemented_level } } } }'
    }
  ],
  [
    'created, sealed and finished transfers by Tezos address and Etherlink address, offset: 0, limit: 100',
    {
      address: ['tz1M6VFkpALGXYoP5CvobR3z1pYu7KvirpMF', '0x4A1819c83A78C948db50f80fED82721Dd0401c9b'],
      offset: 0,
      limit: 100,
      filter: {
        status: ['CREATED', 'SEALED', 'FINISHED']
      },
      expectedQuery: 'query TokenTransfers { bridge_operation( where: { status: { _in: ["CREATED","SEALED","FINISHED"] }, _or: [ { deposit: { l1_transaction: { _or: [ { l1_account: { _eq: "tz1M6VFkpALGXYoP5CvobR3z1pYu7KvirpMF" } }{ l2_account: { _eq: "4a1819c83a78c948db50f80fed82721dd0401c9b" } } ] } } } { withdrawal: { l2_transaction: { _or: [ { l1_account: { _eq: "tz1M6VFkpALGXYoP5CvobR3z1pYu7KvirpMF" } }{ l2_account: { _eq: "4a1819c83a78c948db50f80fed82721dd0401c9b" } } ] } } } ] }, order_by: { created_at: desc }, offset: 0, limit: 100 ) { type status is_completed is_successful created_at updated_at deposit { l1_transaction { level operation_hash counter nonce amount ticket { token { type contract_address token_id } } l1_account l2_account timestamp } l2_transaction { level transaction_hash log_index amount l2_token { id } timestamp } inbox_message { type level index } } withdrawal { l1_transaction { level operation_hash counter nonce timestamp } l2_transaction { level transaction_hash log_index amount l2_token { id ticket { token { type contract_address token_id } } } l1_account l2_account timestamp } outbox_message { level index commitment { hash } proof cemented_at cemented_level } } } }'
    }
  ],

  [
    'created and finished deposits by Tezos address and Etherlink address, offset: 0, limit: 100',
    {
      address: ['tz1M6VFkpALGXYoP5CvobR3z1pYu7KvirpMF', '0x4A1819c83A78C948db50f80fED82721Dd0401c9b'],
      offset: 0,
      limit: 100,
      filter: {
        type: ['deposit'],
        status: ['CREATED', 'FINISHED']
      },
      expectedQuery: 'query TokenTransfers { bridge_operation( where: { type: { _eq: "deposit" }, status: { _in: ["CREATED","FINISHED"] }, _or: [ { deposit: { l1_transaction: { _or: [ { l1_account: { _eq: "tz1M6VFkpALGXYoP5CvobR3z1pYu7KvirpMF" } }{ l2_account: { _eq: "4a1819c83a78c948db50f80fed82721dd0401c9b" } } ] } } } { withdrawal: { l2_transaction: { _or: [ { l1_account: { _eq: "tz1M6VFkpALGXYoP5CvobR3z1pYu7KvirpMF" } }{ l2_account: { _eq: "4a1819c83a78c948db50f80fed82721dd0401c9b" } } ] } } } ] }, order_by: { created_at: desc }, offset: 0, limit: 100 ) { type status is_completed is_successful created_at updated_at deposit { l1_transaction { level operation_hash counter nonce amount ticket { token { type contract_address token_id } } l1_account l2_account timestamp } l2_transaction { level transaction_hash log_index amount l2_token { id } timestamp } inbox_message { type level index } } withdrawal { l1_transaction { level operation_hash counter nonce timestamp } l2_transaction { level transaction_hash log_index amount l2_token { id ticket { token { type contract_address token_id } } } l1_account l2_account timestamp } outbox_message { level index commitment { hash } proof cemented_at cemented_level } } } }'
    }
  ],
  [
    'created and sealed withdrawals by Tezos address and Etherlink address, offset: 0, limit: 100',
    {
      address: ['tz1M6VFkpALGXYoP5CvobR3z1pYu7KvirpMF', '0x4A1819c83A78C948db50f80fED82721Dd0401c9b'],
      offset: 0,
      limit: 100,
      filter: {
        type: ['withdrawal'],
        status: ['CREATED', 'SEALED']
      },
      expectedQuery: 'query TokenTransfers { bridge_operation( where: { type: { _eq: "withdrawal" }, status: { _in: ["CREATED","SEALED"] }, _or: [ { deposit: { l1_transaction: { _or: [ { l1_account: { _eq: "tz1M6VFkpALGXYoP5CvobR3z1pYu7KvirpMF" } }{ l2_account: { _eq: "4a1819c83a78c948db50f80fed82721dd0401c9b" } } ] } } } { withdrawal: { l2_transaction: { _or: [ { l1_account: { _eq: "tz1M6VFkpALGXYoP5CvobR3z1pYu7KvirpMF" } }{ l2_account: { _eq: "4a1819c83a78c948db50f80fed82721dd0401c9b" } } ] } } } ] }, order_by: { created_at: desc }, offset: 0, limit: 100 ) { type status is_completed is_successful created_at updated_at deposit { l1_transaction { level operation_hash counter nonce amount ticket { token { type contract_address token_id } } l1_account l2_account timestamp } l2_transaction { level transaction_hash log_index amount l2_token { id } timestamp } inbox_message { type level index } } withdrawal { l1_transaction { level operation_hash counter nonce timestamp } l2_transaction { level transaction_hash log_index amount l2_token { id ticket { token { type contract_address token_id } } } l1_account l2_account timestamp } outbox_message { level index commitment { hash } proof cemented_at cemented_level } } } }'
    }
  ],
  [
    'deposit and withdrawals with created and finished statuses by Tezos address and Etherlink address, offset: 0, limit: 100',
    {
      address: ['tz1M6VFkpALGXYoP5CvobR3z1pYu7KvirpMF', '0x4A1819c83A78C948db50f80fED82721Dd0401c9b'],
      offset: 0,
      limit: 100,
      filter: {
        type: ['deposit', 'withdrawal'],
        status: ['CREATED', 'FINISHED']
      },
      expectedQuery: 'query TokenTransfers { bridge_operation( where: { type: { _in: ["deposit","withdrawal"] }, status: { _in: ["CREATED","FINISHED"] }, _or: [ { deposit: { l1_transaction: { _or: [ { l1_account: { _eq: "tz1M6VFkpALGXYoP5CvobR3z1pYu7KvirpMF" } }{ l2_account: { _eq: "4a1819c83a78c948db50f80fed82721dd0401c9b" } } ] } } } { withdrawal: { l2_transaction: { _or: [ { l1_account: { _eq: "tz1M6VFkpALGXYoP5CvobR3z1pYu7KvirpMF" } }{ l2_account: { _eq: "4a1819c83a78c948db50f80fed82721dd0401c9b" } } ] } } } ] }, order_by: { created_at: desc }, offset: 0, limit: 100 ) { type status is_completed is_successful created_at updated_at deposit { l1_transaction { level operation_hash counter nonce amount ticket { token { type contract_address token_id } } l1_account l2_account timestamp } l2_transaction { level transaction_hash log_index amount l2_token { id } timestamp } inbox_message { type level index } } withdrawal { l1_transaction { level operation_hash counter nonce timestamp } l2_transaction { level transaction_hash log_index amount l2_token { id ticket { token { type contract_address token_id } } } l1_account l2_account timestamp } outbox_message { level index commitment { hash } proof cemented_at cemented_level } } } }'
    }
  ],
];
