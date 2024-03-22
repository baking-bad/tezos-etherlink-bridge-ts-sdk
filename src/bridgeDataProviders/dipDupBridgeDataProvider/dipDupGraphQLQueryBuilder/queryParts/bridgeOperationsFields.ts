export const getBridgeOperationsFields = (bridgeDepositFields: string | null, bridgeWithdrawalFields: string | null) => `
type
status
is_completed
is_successful
created_at
updated_at
${bridgeDepositFields ? `deposit { ${bridgeDepositFields} }` : ''}
${bridgeWithdrawalFields ? `withdrawal { ${bridgeWithdrawalFields} }` : ''}
`;
