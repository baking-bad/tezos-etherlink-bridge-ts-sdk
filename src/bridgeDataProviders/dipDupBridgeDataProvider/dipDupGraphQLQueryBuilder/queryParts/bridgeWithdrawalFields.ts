export const bridgeWithdrawalFields = `
l1_transaction {
  level
  operation_hash
  timestamp
}
l2_transaction {
  level
  transaction_hash
  amount
  l2_token {
    id
    ticket {
      token {
        type
        contract_address
        token_id
      }
    }
  }
  l1_account
  l2_account
  timestamp
  outbox_message {
    level
    index
    commitment {
      hash
    }
    proof
  }
}`;
