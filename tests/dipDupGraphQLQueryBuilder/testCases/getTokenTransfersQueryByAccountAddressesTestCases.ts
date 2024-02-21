/* eslint-disable max-len */
import { PositiveTestCaseBase } from './testCase';

type TestCase = PositiveTestCaseBase<{
  address: string | string[] | undefined | null,
  offset: number,
  limit: number
}>;
type TestCases = readonly TestCase[];

export const getTokenTransfersQueryByAccountAddressesTestCases: TestCases = [
  [
    'by one Tezos address (as string), offset: 0, limit: 100',
    {
      address: 'tz1M6VFkpALGXYoP5CvobR3z1pYu7KvirpMF',
      offset: 0,
      limit: 100,
      expectedQuery: 'query TokenTransfers { bridge_operation( where: { _or: [ { deposit: { l1_transaction: { l1_account: { _eq: "tz1M6VFkpALGXYoP5CvobR3z1pYu7KvirpMF" } } } } { withdrawal: { l2_transaction: { l1_account: { _eq: "tz1M6VFkpALGXYoP5CvobR3z1pYu7KvirpMF" } } } } ] }, order_by: { created_at: desc }, offset: 0, limit: 100 ) { type is_completed is_successful created_at updated_at deposit { l1_transaction { level operation_hash amount ticket { token { type contract_address token_id } } l1_account l2_account timestamp inbox_message { type level index } } l2_transaction { level transaction_hash amount l2_token { id } timestamp } } withdrawal { l1_transaction { level operation_hash timestamp } l2_transaction { level transaction_hash amount l2_token { id ticket { token { type contract_address token_id } } } l1_account l2_account timestamp outbox_message { level index commitment { hash } proof } } } } }'
    }
  ],
  [
    'by one Tezos address (as array of strings), offset: 0, limit: 100',
    {
      address: ['tz1M6VFkpALGXYoP5CvobR3z1pYu7KvirpMF'],
      offset: 0,
      limit: 100,
      expectedQuery: 'query TokenTransfers { bridge_operation( where: { _or: [ { deposit: { l1_transaction: { l1_account: { _eq: "tz1M6VFkpALGXYoP5CvobR3z1pYu7KvirpMF" } } } } { withdrawal: { l2_transaction: { l1_account: { _eq: "tz1M6VFkpALGXYoP5CvobR3z1pYu7KvirpMF" } } } } ] }, order_by: { created_at: desc }, offset: 0, limit: 100 ) { type is_completed is_successful created_at updated_at deposit { l1_transaction { level operation_hash amount ticket { token { type contract_address token_id } } l1_account l2_account timestamp inbox_message { type level index } } l2_transaction { level transaction_hash amount l2_token { id } timestamp } } withdrawal { l1_transaction { level operation_hash timestamp } l2_transaction { level transaction_hash amount l2_token { id ticket { token { type contract_address token_id } } } l1_account l2_account timestamp outbox_message { level index commitment { hash } proof } } } } }'
    }
  ],
  [
    'by one Etherlink address (as string), offset: 0, limit: 100',
    {
      address: '0x4A1819c83A78C948db50f80fED82721Dd0401c9b',
      offset: 0,
      limit: 100,
      expectedQuery: 'query TokenTransfers { bridge_operation( where: { _or: [ { deposit: { l1_transaction: { l2_account: { _eq: "4a1819c83a78c948db50f80fed82721dd0401c9b" } } } } { withdrawal: { l2_transaction: { l2_account: { _eq: "4a1819c83a78c948db50f80fed82721dd0401c9b" } } } } ] }, order_by: { created_at: desc }, offset: 0, limit: 100 ) { type is_completed is_successful created_at updated_at deposit { l1_transaction { level operation_hash amount ticket { token { type contract_address token_id } } l1_account l2_account timestamp inbox_message { type level index } } l2_transaction { level transaction_hash amount l2_token { id } timestamp } } withdrawal { l1_transaction { level operation_hash timestamp } l2_transaction { level transaction_hash amount l2_token { id ticket { token { type contract_address token_id } } } l1_account l2_account timestamp outbox_message { level index commitment { hash } proof } } } } }'
    }
  ],
  [
    'by one Etherlink address (as array of strings), offset: 0, limit: 100',
    {
      address: ['0x4A1819c83A78C948db50f80fED82721Dd0401c9b'],
      offset: 0,
      limit: 100,
      expectedQuery: 'query TokenTransfers { bridge_operation( where: { _or: [ { deposit: { l1_transaction: { l2_account: { _eq: "4a1819c83a78c948db50f80fed82721dd0401c9b" } } } } { withdrawal: { l2_transaction: { l2_account: { _eq: "4a1819c83a78c948db50f80fed82721dd0401c9b" } } } } ] }, order_by: { created_at: desc }, offset: 0, limit: 100 ) { type is_completed is_successful created_at updated_at deposit { l1_transaction { level operation_hash amount ticket { token { type contract_address token_id } } l1_account l2_account timestamp inbox_message { type level index } } l2_transaction { level transaction_hash amount l2_token { id } timestamp } } withdrawal { l1_transaction { level operation_hash timestamp } l2_transaction { level transaction_hash amount l2_token { id ticket { token { type contract_address token_id } } } l1_account l2_account timestamp outbox_message { level index commitment { hash } proof } } } } }'
    }
  ],

  [
    'by two Tezos addresses, offset: 0, limit: 100',
    {
      address: ['tz1M6VFkpALGXYoP5CvobR3z1pYu7KvirpMF', 'tz1YG6P2GTQKFpd9jeuESam2vg6aA9HHRkKo'],
      offset: 0,
      limit: 100,
      expectedQuery: 'query TokenTransfers { bridge_operation( where: { _or: [ { deposit: { l1_transaction: { l1_account: { _in: ["tz1M6VFkpALGXYoP5CvobR3z1pYu7KvirpMF","tz1YG6P2GTQKFpd9jeuESam2vg6aA9HHRkKo"] } } } } { withdrawal: { l2_transaction: { l1_account: { _in: ["tz1M6VFkpALGXYoP5CvobR3z1pYu7KvirpMF","tz1YG6P2GTQKFpd9jeuESam2vg6aA9HHRkKo"] } } } } ] }, order_by: { created_at: desc }, offset: 0, limit: 100 ) { type is_completed is_successful created_at updated_at deposit { l1_transaction { level operation_hash amount ticket { token { type contract_address token_id } } l1_account l2_account timestamp inbox_message { type level index } } l2_transaction { level transaction_hash amount l2_token { id } timestamp } } withdrawal { l1_transaction { level operation_hash timestamp } l2_transaction { level transaction_hash amount l2_token { id ticket { token { type contract_address token_id } } } l1_account l2_account timestamp outbox_message { level index commitment { hash } proof } } } } }'
    }
  ],
  [
    'by two Etherlink addresses, offset: 0, limit: 100',
    {
      address: ['0x4A1819c83A78C948db50f80fED82721Dd0401c9b', '0xBefD2C6fFC36249ebEbd21d6DF6376ecF3BAc448'],
      offset: 0,
      limit: 100,
      expectedQuery: 'query TokenTransfers { bridge_operation( where: { _or: [ { deposit: { l1_transaction: { l2_account: { _in: ["4a1819c83a78c948db50f80fed82721dd0401c9b","befd2c6ffc36249ebebd21d6df6376ecf3bac448"] } } } } { withdrawal: { l2_transaction: { l2_account: { _in: ["4a1819c83a78c948db50f80fed82721dd0401c9b","befd2c6ffc36249ebebd21d6df6376ecf3bac448"] } } } } ] }, order_by: { created_at: desc }, offset: 0, limit: 100 ) { type is_completed is_successful created_at updated_at deposit { l1_transaction { level operation_hash amount ticket { token { type contract_address token_id } } l1_account l2_account timestamp inbox_message { type level index } } l2_transaction { level transaction_hash amount l2_token { id } timestamp } } withdrawal { l1_transaction { level operation_hash timestamp } l2_transaction { level transaction_hash amount l2_token { id ticket { token { type contract_address token_id } } } l1_account l2_account timestamp outbox_message { level index commitment { hash } proof } } } } }'
    }
  ],
  [
    'by three Tezos addresses, offset: 0, limit: 100',
    {
      address: ['tz1M6VFkpALGXYoP5CvobR3z1pYu7KvirpMF', 'tz1YG6P2GTQKFpd9jeuESam2vg6aA9HHRkKo', 'tz1N96ka7u5cKVbrLdK6wa6KyLoAgdfDzKns'],
      offset: 0,
      limit: 100,
      expectedQuery: 'query TokenTransfers { bridge_operation( where: { _or: [ { deposit: { l1_transaction: { l1_account: { _in: ["tz1M6VFkpALGXYoP5CvobR3z1pYu7KvirpMF","tz1YG6P2GTQKFpd9jeuESam2vg6aA9HHRkKo","tz1N96ka7u5cKVbrLdK6wa6KyLoAgdfDzKns"] } } } } { withdrawal: { l2_transaction: { l1_account: { _in: ["tz1M6VFkpALGXYoP5CvobR3z1pYu7KvirpMF","tz1YG6P2GTQKFpd9jeuESam2vg6aA9HHRkKo","tz1N96ka7u5cKVbrLdK6wa6KyLoAgdfDzKns"] } } } } ] }, order_by: { created_at: desc }, offset: 0, limit: 100 ) { type is_completed is_successful created_at updated_at deposit { l1_transaction { level operation_hash amount ticket { token { type contract_address token_id } } l1_account l2_account timestamp inbox_message { type level index } } l2_transaction { level transaction_hash amount l2_token { id } timestamp } } withdrawal { l1_transaction { level operation_hash timestamp } l2_transaction { level transaction_hash amount l2_token { id ticket { token { type contract_address token_id } } } l1_account l2_account timestamp outbox_message { level index commitment { hash } proof } } } } }'
    }
  ],
  [
    'by three Etherlink addresses, offset: 0, limit: 100',
    {
      address: ['0x4A1819c83A78C948db50f80fED82721Dd0401c9b', '0xBefD2C6fFC36249ebEbd21d6DF6376ecF3BAc448', '0xce912ad4F73dBC149110091044a8f58Fd17B2b53'],
      offset: 0,
      limit: 100,
      expectedQuery: 'query TokenTransfers { bridge_operation( where: { _or: [ { deposit: { l1_transaction: { l2_account: { _in: ["4a1819c83a78c948db50f80fed82721dd0401c9b","befd2c6ffc36249ebebd21d6df6376ecf3bac448","ce912ad4f73dbc149110091044a8f58fd17b2b53"] } } } } { withdrawal: { l2_transaction: { l2_account: { _in: ["4a1819c83a78c948db50f80fed82721dd0401c9b","befd2c6ffc36249ebebd21d6df6376ecf3bac448","ce912ad4f73dbc149110091044a8f58fd17b2b53"] } } } } ] }, order_by: { created_at: desc }, offset: 0, limit: 100 ) { type is_completed is_successful created_at updated_at deposit { l1_transaction { level operation_hash amount ticket { token { type contract_address token_id } } l1_account l2_account timestamp inbox_message { type level index } } l2_transaction { level transaction_hash amount l2_token { id } timestamp } } withdrawal { l1_transaction { level operation_hash timestamp } l2_transaction { level transaction_hash amount l2_token { id ticket { token { type contract_address token_id } } } l1_account l2_account timestamp outbox_message { level index commitment { hash } proof } } } } }'
    }
  ],

  [
    'by Tezos address and Etherlink address, offset: 0, limit: 100',
    {
      address: ['tz1M6VFkpALGXYoP5CvobR3z1pYu7KvirpMF', '0x4A1819c83A78C948db50f80fED82721Dd0401c9b'],
      offset: 0,
      limit: 100,
      expectedQuery: 'query TokenTransfers { bridge_operation( where: { _or: [ { deposit: { l1_transaction: { _or: [ { l1_account: { _eq: "tz1M6VFkpALGXYoP5CvobR3z1pYu7KvirpMF" } }{ l2_account: { _eq: "4a1819c83a78c948db50f80fed82721dd0401c9b" } } ] } } } { withdrawal: { l2_transaction: { _or: [ { l1_account: { _eq: "tz1M6VFkpALGXYoP5CvobR3z1pYu7KvirpMF" } }{ l2_account: { _eq: "4a1819c83a78c948db50f80fed82721dd0401c9b" } } ] } } } ] }, order_by: { created_at: desc }, offset: 0, limit: 100 ) { type is_completed is_successful created_at updated_at deposit { l1_transaction { level operation_hash amount ticket { token { type contract_address token_id } } l1_account l2_account timestamp inbox_message { type level index } } l2_transaction { level transaction_hash amount l2_token { id } timestamp } } withdrawal { l1_transaction { level operation_hash timestamp } l2_transaction { level transaction_hash amount l2_token { id ticket { token { type contract_address token_id } } } l1_account l2_account timestamp outbox_message { level index commitment { hash } proof } } } } }'
    }
  ],
  [
    'by two Tezos addresses and two Etherlink addresses, offset: 0, limit: 100',
    {
      address: [
        'tz1M6VFkpALGXYoP5CvobR3z1pYu7KvirpMF',
        '0x4A1819c83A78C948db50f80fED82721Dd0401c9b',
        '0xBefD2C6fFC36249ebEbd21d6DF6376ecF3BAc448',
        'tz1YG6P2GTQKFpd9jeuESam2vg6aA9HHRkKo'
      ],
      offset: 0,
      limit: 100,
      expectedQuery: 'query TokenTransfers { bridge_operation( where: { _or: [ { deposit: { l1_transaction: { _or: [ { l1_account: { _in: ["tz1M6VFkpALGXYoP5CvobR3z1pYu7KvirpMF","tz1YG6P2GTQKFpd9jeuESam2vg6aA9HHRkKo"] } }{ l2_account: { _in: ["4a1819c83a78c948db50f80fed82721dd0401c9b","befd2c6ffc36249ebebd21d6df6376ecf3bac448"] } } ] } } } { withdrawal: { l2_transaction: { _or: [ { l1_account: { _in: ["tz1M6VFkpALGXYoP5CvobR3z1pYu7KvirpMF","tz1YG6P2GTQKFpd9jeuESam2vg6aA9HHRkKo"] } }{ l2_account: { _in: ["4a1819c83a78c948db50f80fed82721dd0401c9b","befd2c6ffc36249ebebd21d6df6376ecf3bac448"] } } ] } } } ] }, order_by: { created_at: desc }, offset: 0, limit: 100 ) { type is_completed is_successful created_at updated_at deposit { l1_transaction { level operation_hash amount ticket { token { type contract_address token_id } } l1_account l2_account timestamp inbox_message { type level index } } l2_transaction { level transaction_hash amount l2_token { id } timestamp } } withdrawal { l1_transaction { level operation_hash timestamp } l2_transaction { level transaction_hash amount l2_token { id ticket { token { type contract_address token_id } } } l1_account l2_account timestamp outbox_message { level index commitment { hash } proof } } } } }'
    }
  ],
  [
    'by three Tezos addresses and three Etherlink addresses, offset: 0, limit: 100',
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
      expectedQuery: 'query TokenTransfers { bridge_operation( where: { _or: [ { deposit: { l1_transaction: { _or: [ { l1_account: { _in: ["tz1M6VFkpALGXYoP5CvobR3z1pYu7KvirpMF","tz1YG6P2GTQKFpd9jeuESam2vg6aA9HHRkKo","tz1N96ka7u5cKVbrLdK6wa6KyLoAgdfDzKns"] } }{ l2_account: { _in: ["4a1819c83a78c948db50f80fed82721dd0401c9b","befd2c6ffc36249ebebd21d6df6376ecf3bac448","ce912ad4f73dbc149110091044a8f58fd17b2b53"] } } ] } } } { withdrawal: { l2_transaction: { _or: [ { l1_account: { _in: ["tz1M6VFkpALGXYoP5CvobR3z1pYu7KvirpMF","tz1YG6P2GTQKFpd9jeuESam2vg6aA9HHRkKo","tz1N96ka7u5cKVbrLdK6wa6KyLoAgdfDzKns"] } }{ l2_account: { _in: ["4a1819c83a78c948db50f80fed82721dd0401c9b","befd2c6ffc36249ebebd21d6df6376ecf3bac448","ce912ad4f73dbc149110091044a8f58fd17b2b53"] } } ] } } } ] }, order_by: { created_at: desc }, offset: 0, limit: 100 ) { type is_completed is_successful created_at updated_at deposit { l1_transaction { level operation_hash amount ticket { token { type contract_address token_id } } l1_account l2_account timestamp inbox_message { type level index } } l2_transaction { level transaction_hash amount l2_token { id } timestamp } } withdrawal { l1_transaction { level operation_hash timestamp } l2_transaction { level transaction_hash amount l2_token { id ticket { token { type contract_address token_id } } } l1_account l2_account timestamp outbox_message { level index commitment { hash } proof } } } } }'
    }
  ]
];
