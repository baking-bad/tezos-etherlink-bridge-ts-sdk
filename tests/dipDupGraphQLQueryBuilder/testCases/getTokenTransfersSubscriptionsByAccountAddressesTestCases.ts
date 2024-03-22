/* eslint-disable max-len */
import { PositiveTestCaseBase } from './testCase';

type TestCase = PositiveTestCaseBase<{
  address: string | string[] | undefined | null,
  startUpdatedAt: Date,
}>;
type TestCases = readonly TestCase[];

export const getTokenTransfersSubscriptionsByAccountAddressesTestCases: TestCases = [
  [
    'transfers by one Tezos address (as string)',
    {
      address: 'tz1M6VFkpALGXYoP5CvobR3z1pYu7KvirpMF',
      startUpdatedAt: new Date('2024-03-17T12:13:10.104Z'),
      expectedQuery: 'subscription TokenTransfers { bridge_operation_stream( where: { _or: [ { deposit: { l1_transaction: { l1_account: { _eq: "tz1M6VFkpALGXYoP5CvobR3z1pYu7KvirpMF" } } } } { withdrawal: { l2_transaction: { l1_account: { _eq: "tz1M6VFkpALGXYoP5CvobR3z1pYu7KvirpMF" } } } } ] }, batch_size: 10, cursor: {initial_value: {updated_at: "2024-03-17T12:13:10.104Z"}, ordering: ASC} ) { type status is_completed is_successful created_at updated_at deposit { l1_transaction { level operation_hash counter nonce amount ticket { token { type contract_address token_id } } l1_account l2_account timestamp inbox_message { type level index } } l2_transaction { level transaction_hash log_index amount l2_token { id } timestamp } } withdrawal { l1_transaction { level operation_hash counter nonce timestamp } l2_transaction { level transaction_hash log_index amount l2_token { id ticket { token { type contract_address token_id } } } l1_account l2_account timestamp outbox_message { level index commitment { hash } proof cemented_at } } } } }'
    }
  ],
  [
    'transfers by one Tezos address (as array of strings)',
    {
      address: ['tz1M6VFkpALGXYoP5CvobR3z1pYu7KvirpMF'],
      startUpdatedAt: new Date('2024-03-17T12:13:10.104Z'),
      expectedQuery: 'subscription TokenTransfers { bridge_operation_stream( where: { _or: [ { deposit: { l1_transaction: { l1_account: { _eq: "tz1M6VFkpALGXYoP5CvobR3z1pYu7KvirpMF" } } } } { withdrawal: { l2_transaction: { l1_account: { _eq: "tz1M6VFkpALGXYoP5CvobR3z1pYu7KvirpMF" } } } } ] }, batch_size: 10, cursor: {initial_value: {updated_at: "2024-03-17T12:13:10.104Z"}, ordering: ASC} ) { type status is_completed is_successful created_at updated_at deposit { l1_transaction { level operation_hash counter nonce amount ticket { token { type contract_address token_id } } l1_account l2_account timestamp inbox_message { type level index } } l2_transaction { level transaction_hash log_index amount l2_token { id } timestamp } } withdrawal { l1_transaction { level operation_hash counter nonce timestamp } l2_transaction { level transaction_hash log_index amount l2_token { id ticket { token { type contract_address token_id } } } l1_account l2_account timestamp outbox_message { level index commitment { hash } proof cemented_at } } } } }'
    }
  ],
  [
    'transfers by one Etherlink address (as string)',
    {
      address: '0x4A1819c83A78C948db50f80fED82721Dd0401c9b',
      startUpdatedAt: new Date('2024-03-17T12:13:10.104Z'),
      expectedQuery: 'subscription TokenTransfers { bridge_operation_stream( where: { _or: [ { deposit: { l1_transaction: { l2_account: { _eq: "4a1819c83a78c948db50f80fed82721dd0401c9b" } } } } { withdrawal: { l2_transaction: { l2_account: { _eq: "4a1819c83a78c948db50f80fed82721dd0401c9b" } } } } ] }, batch_size: 10, cursor: {initial_value: {updated_at: "2024-03-17T12:13:10.104Z"}, ordering: ASC} ) { type status is_completed is_successful created_at updated_at deposit { l1_transaction { level operation_hash counter nonce amount ticket { token { type contract_address token_id } } l1_account l2_account timestamp inbox_message { type level index } } l2_transaction { level transaction_hash log_index amount l2_token { id } timestamp } } withdrawal { l1_transaction { level operation_hash counter nonce timestamp } l2_transaction { level transaction_hash log_index amount l2_token { id ticket { token { type contract_address token_id } } } l1_account l2_account timestamp outbox_message { level index commitment { hash } proof cemented_at } } } } }'
    }
  ],
  [
    'transfers by one Etherlink address (as array of strings)',
    {
      address: ['0x4A1819c83A78C948db50f80fED82721Dd0401c9b'],
      startUpdatedAt: new Date('2024-03-17T12:13:10.104Z'),
      expectedQuery: 'subscription TokenTransfers { bridge_operation_stream( where: { _or: [ { deposit: { l1_transaction: { l2_account: { _eq: "4a1819c83a78c948db50f80fed82721dd0401c9b" } } } } { withdrawal: { l2_transaction: { l2_account: { _eq: "4a1819c83a78c948db50f80fed82721dd0401c9b" } } } } ] }, batch_size: 10, cursor: {initial_value: {updated_at: "2024-03-17T12:13:10.104Z"}, ordering: ASC} ) { type status is_completed is_successful created_at updated_at deposit { l1_transaction { level operation_hash counter nonce amount ticket { token { type contract_address token_id } } l1_account l2_account timestamp inbox_message { type level index } } l2_transaction { level transaction_hash log_index amount l2_token { id } timestamp } } withdrawal { l1_transaction { level operation_hash counter nonce timestamp } l2_transaction { level transaction_hash log_index amount l2_token { id ticket { token { type contract_address token_id } } } l1_account l2_account timestamp outbox_message { level index commitment { hash } proof cemented_at } } } } }'
    }
  ],

  [
    'transfers by two Tezos addresses',
    {
      address: ['tz1M6VFkpALGXYoP5CvobR3z1pYu7KvirpMF', 'tz1YG6P2GTQKFpd9jeuESam2vg6aA9HHRkKo'],
      startUpdatedAt: new Date('2024-03-17T12:13:10.104Z'),
      expectedQuery: 'subscription TokenTransfers { bridge_operation_stream( where: { _or: [ { deposit: { l1_transaction: { l1_account: { _in: ["tz1M6VFkpALGXYoP5CvobR3z1pYu7KvirpMF","tz1YG6P2GTQKFpd9jeuESam2vg6aA9HHRkKo"] } } } } { withdrawal: { l2_transaction: { l1_account: { _in: ["tz1M6VFkpALGXYoP5CvobR3z1pYu7KvirpMF","tz1YG6P2GTQKFpd9jeuESam2vg6aA9HHRkKo"] } } } } ] }, batch_size: 10, cursor: {initial_value: {updated_at: "2024-03-17T12:13:10.104Z"}, ordering: ASC} ) { type status is_completed is_successful created_at updated_at deposit { l1_transaction { level operation_hash counter nonce amount ticket { token { type contract_address token_id } } l1_account l2_account timestamp inbox_message { type level index } } l2_transaction { level transaction_hash log_index amount l2_token { id } timestamp } } withdrawal { l1_transaction { level operation_hash counter nonce timestamp } l2_transaction { level transaction_hash log_index amount l2_token { id ticket { token { type contract_address token_id } } } l1_account l2_account timestamp outbox_message { level index commitment { hash } proof cemented_at } } } } }'
    }
  ],
  [
    'transfers by two Etherlink addresses',
    {
      address: ['0x4A1819c83A78C948db50f80fED82721Dd0401c9b', '0xBefD2C6fFC36249ebEbd21d6DF6376ecF3BAc448'],
      startUpdatedAt: new Date('2024-03-17T12:13:10.104Z'),
      expectedQuery: 'subscription TokenTransfers { bridge_operation_stream( where: { _or: [ { deposit: { l1_transaction: { l2_account: { _in: ["4a1819c83a78c948db50f80fed82721dd0401c9b","befd2c6ffc36249ebebd21d6df6376ecf3bac448"] } } } } { withdrawal: { l2_transaction: { l2_account: { _in: ["4a1819c83a78c948db50f80fed82721dd0401c9b","befd2c6ffc36249ebebd21d6df6376ecf3bac448"] } } } } ] }, batch_size: 10, cursor: {initial_value: {updated_at: "2024-03-17T12:13:10.104Z"}, ordering: ASC} ) { type status is_completed is_successful created_at updated_at deposit { l1_transaction { level operation_hash counter nonce amount ticket { token { type contract_address token_id } } l1_account l2_account timestamp inbox_message { type level index } } l2_transaction { level transaction_hash log_index amount l2_token { id } timestamp } } withdrawal { l1_transaction { level operation_hash counter nonce timestamp } l2_transaction { level transaction_hash log_index amount l2_token { id ticket { token { type contract_address token_id } } } l1_account l2_account timestamp outbox_message { level index commitment { hash } proof cemented_at } } } } }'
    }
  ],
  [
    'transfers by three Tezos addresses',
    {
      address: ['tz1M6VFkpALGXYoP5CvobR3z1pYu7KvirpMF', 'tz1YG6P2GTQKFpd9jeuESam2vg6aA9HHRkKo', 'tz1N96ka7u5cKVbrLdK6wa6KyLoAgdfDzKns'],
      startUpdatedAt: new Date('2024-03-17T12:13:10.104Z'),
      expectedQuery: 'subscription TokenTransfers { bridge_operation_stream( where: { _or: [ { deposit: { l1_transaction: { l1_account: { _in: ["tz1M6VFkpALGXYoP5CvobR3z1pYu7KvirpMF","tz1YG6P2GTQKFpd9jeuESam2vg6aA9HHRkKo","tz1N96ka7u5cKVbrLdK6wa6KyLoAgdfDzKns"] } } } } { withdrawal: { l2_transaction: { l1_account: { _in: ["tz1M6VFkpALGXYoP5CvobR3z1pYu7KvirpMF","tz1YG6P2GTQKFpd9jeuESam2vg6aA9HHRkKo","tz1N96ka7u5cKVbrLdK6wa6KyLoAgdfDzKns"] } } } } ] }, batch_size: 10, cursor: {initial_value: {updated_at: "2024-03-17T12:13:10.104Z"}, ordering: ASC} ) { type status is_completed is_successful created_at updated_at deposit { l1_transaction { level operation_hash counter nonce amount ticket { token { type contract_address token_id } } l1_account l2_account timestamp inbox_message { type level index } } l2_transaction { level transaction_hash log_index amount l2_token { id } timestamp } } withdrawal { l1_transaction { level operation_hash counter nonce timestamp } l2_transaction { level transaction_hash log_index amount l2_token { id ticket { token { type contract_address token_id } } } l1_account l2_account timestamp outbox_message { level index commitment { hash } proof cemented_at } } } } }'
    }
  ],
  [
    'transfers by three Etherlink addresses',
    {
      address: ['0x4A1819c83A78C948db50f80fED82721Dd0401c9b', '0xBefD2C6fFC36249ebEbd21d6DF6376ecF3BAc448', '0xce912ad4F73dBC149110091044a8f58Fd17B2b53'],
      startUpdatedAt: new Date('2024-03-17T12:13:10.104Z'),
      expectedQuery: 'subscription TokenTransfers { bridge_operation_stream( where: { _or: [ { deposit: { l1_transaction: { l2_account: { _in: ["4a1819c83a78c948db50f80fed82721dd0401c9b","befd2c6ffc36249ebebd21d6df6376ecf3bac448","ce912ad4f73dbc149110091044a8f58fd17b2b53"] } } } } { withdrawal: { l2_transaction: { l2_account: { _in: ["4a1819c83a78c948db50f80fed82721dd0401c9b","befd2c6ffc36249ebebd21d6df6376ecf3bac448","ce912ad4f73dbc149110091044a8f58fd17b2b53"] } } } } ] }, batch_size: 10, cursor: {initial_value: {updated_at: "2024-03-17T12:13:10.104Z"}, ordering: ASC} ) { type status is_completed is_successful created_at updated_at deposit { l1_transaction { level operation_hash counter nonce amount ticket { token { type contract_address token_id } } l1_account l2_account timestamp inbox_message { type level index } } l2_transaction { level transaction_hash log_index amount l2_token { id } timestamp } } withdrawal { l1_transaction { level operation_hash counter nonce timestamp } l2_transaction { level transaction_hash log_index amount l2_token { id ticket { token { type contract_address token_id } } } l1_account l2_account timestamp outbox_message { level index commitment { hash } proof cemented_at } } } } }'
    }
  ],
  [
    'transfers by Tezos address and Etherlink address',
    {
      address: ['tz1M6VFkpALGXYoP5CvobR3z1pYu7KvirpMF', '0x4A1819c83A78C948db50f80fED82721Dd0401c9b'],
      startUpdatedAt: new Date('2024-03-17T12:13:10.104Z'),
      expectedQuery: 'subscription TokenTransfers { bridge_operation_stream( where: { _or: [ { deposit: { l1_transaction: { _or: [ { l1_account: { _eq: "tz1M6VFkpALGXYoP5CvobR3z1pYu7KvirpMF" } }{ l2_account: { _eq: "4a1819c83a78c948db50f80fed82721dd0401c9b" } } ] } } } { withdrawal: { l2_transaction: { _or: [ { l1_account: { _eq: "tz1M6VFkpALGXYoP5CvobR3z1pYu7KvirpMF" } }{ l2_account: { _eq: "4a1819c83a78c948db50f80fed82721dd0401c9b" } } ] } } } ] }, batch_size: 10, cursor: {initial_value: {updated_at: "2024-03-17T12:13:10.104Z"}, ordering: ASC} ) { type status is_completed is_successful created_at updated_at deposit { l1_transaction { level operation_hash counter nonce amount ticket { token { type contract_address token_id } } l1_account l2_account timestamp inbox_message { type level index } } l2_transaction { level transaction_hash log_index amount l2_token { id } timestamp } } withdrawal { l1_transaction { level operation_hash counter nonce timestamp } l2_transaction { level transaction_hash log_index amount l2_token { id ticket { token { type contract_address token_id } } } l1_account l2_account timestamp outbox_message { level index commitment { hash } proof cemented_at } } } } }'
    }
  ],
  [
    'transfers by two Tezos addresses and two Etherlink addresses',
    {
      address: [
        'tz1M6VFkpALGXYoP5CvobR3z1pYu7KvirpMF',
        '0x4A1819c83A78C948db50f80fED82721Dd0401c9b',
        '0xBefD2C6fFC36249ebEbd21d6DF6376ecF3BAc448',
        'tz1YG6P2GTQKFpd9jeuESam2vg6aA9HHRkKo'
      ],
      startUpdatedAt: new Date('2024-03-17T12:13:10.104Z'),
      expectedQuery: 'subscription TokenTransfers { bridge_operation_stream( where: { _or: [ { deposit: { l1_transaction: { _or: [ { l1_account: { _in: ["tz1M6VFkpALGXYoP5CvobR3z1pYu7KvirpMF","tz1YG6P2GTQKFpd9jeuESam2vg6aA9HHRkKo"] } }{ l2_account: { _in: ["4a1819c83a78c948db50f80fed82721dd0401c9b","befd2c6ffc36249ebebd21d6df6376ecf3bac448"] } } ] } } } { withdrawal: { l2_transaction: { _or: [ { l1_account: { _in: ["tz1M6VFkpALGXYoP5CvobR3z1pYu7KvirpMF","tz1YG6P2GTQKFpd9jeuESam2vg6aA9HHRkKo"] } }{ l2_account: { _in: ["4a1819c83a78c948db50f80fed82721dd0401c9b","befd2c6ffc36249ebebd21d6df6376ecf3bac448"] } } ] } } } ] }, batch_size: 10, cursor: {initial_value: {updated_at: "2024-03-17T12:13:10.104Z"}, ordering: ASC} ) { type status is_completed is_successful created_at updated_at deposit { l1_transaction { level operation_hash counter nonce amount ticket { token { type contract_address token_id } } l1_account l2_account timestamp inbox_message { type level index } } l2_transaction { level transaction_hash log_index amount l2_token { id } timestamp } } withdrawal { l1_transaction { level operation_hash counter nonce timestamp } l2_transaction { level transaction_hash log_index amount l2_token { id ticket { token { type contract_address token_id } } } l1_account l2_account timestamp outbox_message { level index commitment { hash } proof cemented_at } } } } }'
    }
  ],
  [
    'transfers by three Tezos addresses and three Etherlink addresses',
    {
      address: [
        'tz1M6VFkpALGXYoP5CvobR3z1pYu7KvirpMF',
        '0x4A1819c83A78C948db50f80fED82721Dd0401c9b',
        '0xBefD2C6fFC36249ebEbd21d6DF6376ecF3BAc448',
        'tz1YG6P2GTQKFpd9jeuESam2vg6aA9HHRkKo',
        'tz1N96ka7u5cKVbrLdK6wa6KyLoAgdfDzKns',
        '0xce912ad4F73dBC149110091044a8f58Fd17B2b53'
      ],
      startUpdatedAt: new Date('2024-03-17T12:13:10.104Z'),
      expectedQuery: 'subscription TokenTransfers { bridge_operation_stream( where: { _or: [ { deposit: { l1_transaction: { _or: [ { l1_account: { _in: ["tz1M6VFkpALGXYoP5CvobR3z1pYu7KvirpMF","tz1YG6P2GTQKFpd9jeuESam2vg6aA9HHRkKo","tz1N96ka7u5cKVbrLdK6wa6KyLoAgdfDzKns"] } }{ l2_account: { _in: ["4a1819c83a78c948db50f80fed82721dd0401c9b","befd2c6ffc36249ebebd21d6df6376ecf3bac448","ce912ad4f73dbc149110091044a8f58fd17b2b53"] } } ] } } } { withdrawal: { l2_transaction: { _or: [ { l1_account: { _in: ["tz1M6VFkpALGXYoP5CvobR3z1pYu7KvirpMF","tz1YG6P2GTQKFpd9jeuESam2vg6aA9HHRkKo","tz1N96ka7u5cKVbrLdK6wa6KyLoAgdfDzKns"] } }{ l2_account: { _in: ["4a1819c83a78c948db50f80fed82721dd0401c9b","befd2c6ffc36249ebebd21d6df6376ecf3bac448","ce912ad4f73dbc149110091044a8f58fd17b2b53"] } } ] } } } ] }, batch_size: 10, cursor: {initial_value: {updated_at: "2024-03-17T12:13:10.104Z"}, ordering: ASC} ) { type status is_completed is_successful created_at updated_at deposit { l1_transaction { level operation_hash counter nonce amount ticket { token { type contract_address token_id } } l1_account l2_account timestamp inbox_message { type level index } } l2_transaction { level transaction_hash log_index amount l2_token { id } timestamp } } withdrawal { l1_transaction { level operation_hash counter nonce timestamp } l2_transaction { level transaction_hash log_index amount l2_token { id ticket { token { type contract_address token_id } } } l1_account l2_account timestamp outbox_message { level index commitment { hash } proof cemented_at } } } } }'
    }
  ]
];
