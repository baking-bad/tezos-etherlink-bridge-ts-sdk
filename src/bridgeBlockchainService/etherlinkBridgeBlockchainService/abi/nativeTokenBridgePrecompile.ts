export const nativeTokenBridgePrecompile = [
  {
    type: 'function',
    name: 'withdraw_base58',
    stateMutability: 'payable',
    inputs: [{ type: 'string', name: 'target' }],
    outputs: [],
  },
] as const;
