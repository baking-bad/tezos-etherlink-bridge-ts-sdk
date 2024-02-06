export const bridgeDepositFields = `
l1_transaction {
  level
  operation_hash
  amount
  ticket {
    token {
      id
      contract_address
      token_id
    }
  }
  l1_account
  l2_account
  timestamp
  inbox_message {
    type
    level
    index
  }
}
l2_transaction {
  level
  transaction_hash
  amount
  l2_token {
    id
  }
  timestamp
}`;
