export interface TokenTransfer {
  readonly blockHash: string;
  readonly blockNumber: string;
  readonly confirmations: string;
  readonly contractAddress: string;
  readonly cumulativeGasUsed: string;
  readonly from: string;
  readonly gas: string;
  readonly gasPrice: string;
  readonly gasUsed: string;
  readonly hash: string;
  readonly input: string;
  readonly logIndex: string;
  readonly nonce: string;
  readonly timeStamp: string;
  readonly to: string;
  readonly tokenDecimal: string;
  readonly tokenName: string;
  readonly tokenSymbol: string;
  readonly transactionIndex: string;
  readonly value: string;
}

export interface GetTokenTransfersResponse {
  readonly message: string;
  readonly result: readonly TokenTransfer[];
  readonly status: '0' | '1';
}
