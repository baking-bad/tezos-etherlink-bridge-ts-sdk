export const bridgeDepositFields = `
l1_transaction {
  level
  operation_hash
  counter
  nonce
  amount
  ticket {
    token {
      type
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
  log_index
  amount
  l2_token {
    id
  }
  timestamp
}`;
