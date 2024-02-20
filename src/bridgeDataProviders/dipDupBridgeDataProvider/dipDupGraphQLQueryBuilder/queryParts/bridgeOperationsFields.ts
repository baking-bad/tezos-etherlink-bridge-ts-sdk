export const getBridgeOperationsFields = (bridgeDepositFields: string | null, bridgeWithdrawalFields: string | null) => `
type
is_completed
is_successful
${bridgeDepositFields ? `deposit { ${bridgeDepositFields} }` : ''}
${bridgeWithdrawalFields ? `withdrawal { ${bridgeWithdrawalFields} }` : ''}
`;
