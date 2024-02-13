/* eslint-disable max-len */
import { PositiveTestCaseBase } from './testCase';

type TestCase = PositiveTestCaseBase<{
  address: string | string[] | undefined | null
}>;
type TestCases = readonly TestCase[];

export const getTokenTransfersQueryByAccountAddressesTestCases: TestCases = [
  [
    'by one Tezos address (as string)',
    {
      address: 'tz1M6VFkpALGXYoP5CvobR3z1pYu7KvirpMF',
      expectedQuery: 'query TokenTransfers { bridge_deposit( order_by: { l1_transaction: { timestamp: desc } } , where: { l1_transaction: { l1_account: { _eq: "tz1M6VFkpALGXYoP5CvobR3z1pYu7KvirpMF" } } } ) { l1_transaction { level operation_hash amount ticket { token { type contract_address token_id } } l1_account l2_account timestamp inbox_message { type level index } } l2_transaction { level transaction_hash amount l2_token { id } timestamp } } bridge_withdrawal( order_by: { l2_transaction: { timestamp: desc } } , where: { l2_transaction: { l1_account: { _eq: "tz1M6VFkpALGXYoP5CvobR3z1pYu7KvirpMF" } } } ) { l1_transaction { level operation_hash timestamp } l2_transaction { level transaction_hash amount l2_token { id tezos_ticket { token { type contract_address token_id } } } l1_account l2_account timestamp outbox_message { level index commitment { hash } proof } } } }'
    }
  ],
  [
    'by one Tezos address (as array of strings)',
    {
      address: ['tz1M6VFkpALGXYoP5CvobR3z1pYu7KvirpMF'],
      expectedQuery: 'query TokenTransfers { bridge_deposit( order_by: { l1_transaction: { timestamp: desc } } , where: { l1_transaction: { l1_account: { _eq: "tz1M6VFkpALGXYoP5CvobR3z1pYu7KvirpMF" } } } ) { l1_transaction { level operation_hash amount ticket { token { type contract_address token_id } } l1_account l2_account timestamp inbox_message { type level index } } l2_transaction { level transaction_hash amount l2_token { id } timestamp } } bridge_withdrawal( order_by: { l2_transaction: { timestamp: desc } } , where: { l2_transaction: { l1_account: { _eq: "tz1M6VFkpALGXYoP5CvobR3z1pYu7KvirpMF" } } } ) { l1_transaction { level operation_hash timestamp } l2_transaction { level transaction_hash amount l2_token { id tezos_ticket { token { type contract_address token_id } } } l1_account l2_account timestamp outbox_message { level index commitment { hash } proof } } } }'
    }
  ],
  [
    'by one Etherlink address (as string)',
    {
      address: '0x4A1819c83A78C948db50f80fED82721Dd0401c9b',
      expectedQuery: 'query TokenTransfers { bridge_deposit( order_by: { l1_transaction: { timestamp: desc } } , where: { l1_transaction: { l2_account: { _eq: "4a1819c83a78c948db50f80fed82721dd0401c9b" } } } ) { l1_transaction { level operation_hash amount ticket { token { type contract_address token_id } } l1_account l2_account timestamp inbox_message { type level index } } l2_transaction { level transaction_hash amount l2_token { id } timestamp } } bridge_withdrawal( order_by: { l2_transaction: { timestamp: desc } } , where: { l2_transaction: { l2_account: { _eq: "4a1819c83a78c948db50f80fed82721dd0401c9b" } } } ) { l1_transaction { level operation_hash timestamp } l2_transaction { level transaction_hash amount l2_token { id tezos_ticket { token { type contract_address token_id } } } l1_account l2_account timestamp outbox_message { level index commitment { hash } proof } } } }'
    }
  ],
  [
    'by one Etherlink address (as array of strings)',
    {
      address: ['0x4A1819c83A78C948db50f80fED82721Dd0401c9b'],
      expectedQuery: 'query TokenTransfers { bridge_deposit( order_by: { l1_transaction: { timestamp: desc } } , where: { l1_transaction: { l2_account: { _eq: "4a1819c83a78c948db50f80fed82721dd0401c9b" } } } ) { l1_transaction { level operation_hash amount ticket { token { type contract_address token_id } } l1_account l2_account timestamp inbox_message { type level index } } l2_transaction { level transaction_hash amount l2_token { id } timestamp } } bridge_withdrawal( order_by: { l2_transaction: { timestamp: desc } } , where: { l2_transaction: { l2_account: { _eq: "4a1819c83a78c948db50f80fed82721dd0401c9b" } } } ) { l1_transaction { level operation_hash timestamp } l2_transaction { level transaction_hash amount l2_token { id tezos_ticket { token { type contract_address token_id } } } l1_account l2_account timestamp outbox_message { level index commitment { hash } proof } } } }'
    }
  ],

  [
    'by two Tezos addresses',
    {
      address: ['tz1M6VFkpALGXYoP5CvobR3z1pYu7KvirpMF', 'tz1YG6P2GTQKFpd9jeuESam2vg6aA9HHRkKo'],
      expectedQuery: 'query TokenTransfers { bridge_deposit( order_by: { l1_transaction: { timestamp: desc } } , where: { l1_transaction: { l1_account: { _in: ["tz1M6VFkpALGXYoP5CvobR3z1pYu7KvirpMF","tz1YG6P2GTQKFpd9jeuESam2vg6aA9HHRkKo"] } } } ) { l1_transaction { level operation_hash amount ticket { token { type contract_address token_id } } l1_account l2_account timestamp inbox_message { type level index } } l2_transaction { level transaction_hash amount l2_token { id } timestamp } } bridge_withdrawal( order_by: { l2_transaction: { timestamp: desc } } , where: { l2_transaction: { l1_account: { _in: ["tz1M6VFkpALGXYoP5CvobR3z1pYu7KvirpMF","tz1YG6P2GTQKFpd9jeuESam2vg6aA9HHRkKo"] } } } ) { l1_transaction { level operation_hash timestamp } l2_transaction { level transaction_hash amount l2_token { id tezos_ticket { token { type contract_address token_id } } } l1_account l2_account timestamp outbox_message { level index commitment { hash } proof } } } }'
    }
  ],
  [
    'by two Etherlink addresses',
    {
      address: ['0x4A1819c83A78C948db50f80fED82721Dd0401c9b', '0xBefD2C6fFC36249ebEbd21d6DF6376ecF3BAc448'],
      expectedQuery: 'query TokenTransfers { bridge_deposit( order_by: { l1_transaction: { timestamp: desc } } , where: { l1_transaction: { l2_account: { _in: ["4a1819c83a78c948db50f80fed82721dd0401c9b","befd2c6ffc36249ebebd21d6df6376ecf3bac448"] } } } ) { l1_transaction { level operation_hash amount ticket { token { type contract_address token_id } } l1_account l2_account timestamp inbox_message { type level index } } l2_transaction { level transaction_hash amount l2_token { id } timestamp } } bridge_withdrawal( order_by: { l2_transaction: { timestamp: desc } } , where: { l2_transaction: { l2_account: { _in: ["4a1819c83a78c948db50f80fed82721dd0401c9b","befd2c6ffc36249ebebd21d6df6376ecf3bac448"] } } } ) { l1_transaction { level operation_hash timestamp } l2_transaction { level transaction_hash amount l2_token { id tezos_ticket { token { type contract_address token_id } } } l1_account l2_account timestamp outbox_message { level index commitment { hash } proof } } } }'
    }
  ],
  [
    'by three Tezos addresses',
    {
      address: ['tz1M6VFkpALGXYoP5CvobR3z1pYu7KvirpMF', 'tz1YG6P2GTQKFpd9jeuESam2vg6aA9HHRkKo', 'tz1N96ka7u5cKVbrLdK6wa6KyLoAgdfDzKns'],
      expectedQuery: 'query TokenTransfers { bridge_deposit( order_by: { l1_transaction: { timestamp: desc } } , where: { l1_transaction: { l1_account: { _in: ["tz1M6VFkpALGXYoP5CvobR3z1pYu7KvirpMF","tz1YG6P2GTQKFpd9jeuESam2vg6aA9HHRkKo","tz1N96ka7u5cKVbrLdK6wa6KyLoAgdfDzKns"] } } } ) { l1_transaction { level operation_hash amount ticket { token { type contract_address token_id } } l1_account l2_account timestamp inbox_message { type level index } } l2_transaction { level transaction_hash amount l2_token { id } timestamp } } bridge_withdrawal( order_by: { l2_transaction: { timestamp: desc } } , where: { l2_transaction: { l1_account: { _in: ["tz1M6VFkpALGXYoP5CvobR3z1pYu7KvirpMF","tz1YG6P2GTQKFpd9jeuESam2vg6aA9HHRkKo","tz1N96ka7u5cKVbrLdK6wa6KyLoAgdfDzKns"] } } } ) { l1_transaction { level operation_hash timestamp } l2_transaction { level transaction_hash amount l2_token { id tezos_ticket { token { type contract_address token_id } } } l1_account l2_account timestamp outbox_message { level index commitment { hash } proof } } } }'
    }
  ],
  [
    'by three Etherlink addresses',
    {
      address: ['0x4A1819c83A78C948db50f80fED82721Dd0401c9b', '0xBefD2C6fFC36249ebEbd21d6DF6376ecF3BAc448', '0xce912ad4F73dBC149110091044a8f58Fd17B2b53'],
      expectedQuery: 'query TokenTransfers { bridge_deposit( order_by: { l1_transaction: { timestamp: desc } } , where: { l1_transaction: { l2_account: { _in: ["4a1819c83a78c948db50f80fed82721dd0401c9b","befd2c6ffc36249ebebd21d6df6376ecf3bac448","ce912ad4f73dbc149110091044a8f58fd17b2b53"] } } } ) { l1_transaction { level operation_hash amount ticket { token { type contract_address token_id } } l1_account l2_account timestamp inbox_message { type level index } } l2_transaction { level transaction_hash amount l2_token { id } timestamp } } bridge_withdrawal( order_by: { l2_transaction: { timestamp: desc } } , where: { l2_transaction: { l2_account: { _in: ["4a1819c83a78c948db50f80fed82721dd0401c9b","befd2c6ffc36249ebebd21d6df6376ecf3bac448","ce912ad4f73dbc149110091044a8f58fd17b2b53"] } } } ) { l1_transaction { level operation_hash timestamp } l2_transaction { level transaction_hash amount l2_token { id tezos_ticket { token { type contract_address token_id } } } l1_account l2_account timestamp outbox_message { level index commitment { hash } proof } } } }'
    }
  ],

  [
    'by Tezos address and Etherlink address',
    {
      address: ['tz1M6VFkpALGXYoP5CvobR3z1pYu7KvirpMF', '0x4A1819c83A78C948db50f80fED82721Dd0401c9b'],
      expectedQuery: 'query TokenTransfers { bridge_deposit( order_by: { l1_transaction: { timestamp: desc } } , where: { _or: [{ l1_transaction: { l1_account: { _eq: "tz1M6VFkpALGXYoP5CvobR3z1pYu7KvirpMF" } } },{ l1_transaction: { l2_account: { _eq: "4a1819c83a78c948db50f80fed82721dd0401c9b" } } } ] } ) { l1_transaction { level operation_hash amount ticket { token { type contract_address token_id } } l1_account l2_account timestamp inbox_message { type level index } } l2_transaction { level transaction_hash amount l2_token { id } timestamp } } bridge_withdrawal( order_by: { l2_transaction: { timestamp: desc } } , where: { _or: [{ l2_transaction: { l1_account: { _eq: "tz1M6VFkpALGXYoP5CvobR3z1pYu7KvirpMF" } } },{ l2_transaction: { l2_account: { _eq: "4a1819c83a78c948db50f80fed82721dd0401c9b" } } } ] } ) { l1_transaction { level operation_hash timestamp } l2_transaction { level transaction_hash amount l2_token { id tezos_ticket { token { type contract_address token_id } } } l1_account l2_account timestamp outbox_message { level index commitment { hash } proof } } } }'
    }
  ],
  [
    'by two Tezos addresses and two Etherlink addresses',
    {
      address: [
        'tz1M6VFkpALGXYoP5CvobR3z1pYu7KvirpMF',
        '0x4A1819c83A78C948db50f80fED82721Dd0401c9b',
        '0xBefD2C6fFC36249ebEbd21d6DF6376ecF3BAc448',
        'tz1YG6P2GTQKFpd9jeuESam2vg6aA9HHRkKo'
      ],
      expectedQuery: 'query TokenTransfers { bridge_deposit( order_by: { l1_transaction: { timestamp: desc } } , where: { _or: [{ l1_transaction: { l1_account: { _in: ["tz1M6VFkpALGXYoP5CvobR3z1pYu7KvirpMF","tz1YG6P2GTQKFpd9jeuESam2vg6aA9HHRkKo"] } } },{ l1_transaction: { l2_account: { _in: ["4a1819c83a78c948db50f80fed82721dd0401c9b","befd2c6ffc36249ebebd21d6df6376ecf3bac448"] } } } ] } ) { l1_transaction { level operation_hash amount ticket { token { type contract_address token_id } } l1_account l2_account timestamp inbox_message { type level index } } l2_transaction { level transaction_hash amount l2_token { id } timestamp } } bridge_withdrawal( order_by: { l2_transaction: { timestamp: desc } } , where: { _or: [{ l2_transaction: { l1_account: { _in: ["tz1M6VFkpALGXYoP5CvobR3z1pYu7KvirpMF","tz1YG6P2GTQKFpd9jeuESam2vg6aA9HHRkKo"] } } },{ l2_transaction: { l2_account: { _in: ["4a1819c83a78c948db50f80fed82721dd0401c9b","befd2c6ffc36249ebebd21d6df6376ecf3bac448"] } } } ] } ) { l1_transaction { level operation_hash timestamp } l2_transaction { level transaction_hash amount l2_token { id tezos_ticket { token { type contract_address token_id } } } l1_account l2_account timestamp outbox_message { level index commitment { hash } proof } } } }'
    }
  ],
  [
    'by three Tezos addresses and three Etherlink addresses',
    {
      address: [
        'tz1M6VFkpALGXYoP5CvobR3z1pYu7KvirpMF',
        '0x4A1819c83A78C948db50f80fED82721Dd0401c9b',
        '0xBefD2C6fFC36249ebEbd21d6DF6376ecF3BAc448',
        'tz1YG6P2GTQKFpd9jeuESam2vg6aA9HHRkKo',
        'tz1N96ka7u5cKVbrLdK6wa6KyLoAgdfDzKns',
        '0xce912ad4F73dBC149110091044a8f58Fd17B2b53'
      ],
      expectedQuery: 'query TokenTransfers { bridge_deposit( order_by: { l1_transaction: { timestamp: desc } } , where: { _or: [{ l1_transaction: { l1_account: { _in: ["tz1M6VFkpALGXYoP5CvobR3z1pYu7KvirpMF","tz1YG6P2GTQKFpd9jeuESam2vg6aA9HHRkKo","tz1N96ka7u5cKVbrLdK6wa6KyLoAgdfDzKns"] } } },{ l1_transaction: { l2_account: { _in: ["4a1819c83a78c948db50f80fed82721dd0401c9b","befd2c6ffc36249ebebd21d6df6376ecf3bac448","ce912ad4f73dbc149110091044a8f58fd17b2b53"] } } } ] } ) { l1_transaction { level operation_hash amount ticket { token { type contract_address token_id } } l1_account l2_account timestamp inbox_message { type level index } } l2_transaction { level transaction_hash amount l2_token { id } timestamp } } bridge_withdrawal( order_by: { l2_transaction: { timestamp: desc } } , where: { _or: [{ l2_transaction: { l1_account: { _in: ["tz1M6VFkpALGXYoP5CvobR3z1pYu7KvirpMF","tz1YG6P2GTQKFpd9jeuESam2vg6aA9HHRkKo","tz1N96ka7u5cKVbrLdK6wa6KyLoAgdfDzKns"] } } },{ l2_transaction: { l2_account: { _in: ["4a1819c83a78c948db50f80fed82721dd0401c9b","befd2c6ffc36249ebebd21d6df6376ecf3bac448","ce912ad4f73dbc149110091044a8f58fd17b2b53"] } } } ] } ) { l1_transaction { level operation_hash timestamp } l2_transaction { level transaction_hash amount l2_token { id tezos_ticket { token { type contract_address token_id } } } l1_account l2_account timestamp outbox_message { level index commitment { hash } proof } } } }'
    }
  ]
];
