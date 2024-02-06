export interface PositiveTestCaseData {
  expectedQuery: string;
}

export type PositiveTestCaseBase<TData> = [
  testName: string,
  testData: PositiveTestCaseData & TData
];
