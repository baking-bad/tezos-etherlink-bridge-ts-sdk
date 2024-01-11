export interface Log {
  readonly address: string;
  readonly blockNumber: string;
  readonly data: string;
  readonly gasPrice: string;
  readonly gasUsed: string;
  readonly logIndex: string;
  readonly timeStamp: string;
  readonly topics: readonly [
    string,
    string | null,
    string | null,
    string | null
  ];
  readonly transactionHash: string;
  readonly transactionIndex: string;
}

export interface GetLogsResponse {
  readonly message: string;
  readonly result: readonly Log[];
  readonly status: '0' | '1';
}
