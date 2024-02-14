export interface PositiveTestCaseData {
  expectedQuery: string;
}

export type PositiveTestCaseBase<TData = object, IncludeBaseType extends boolean = true> = [
  testName: string,
  testData: IncludeBaseType extends true ? PositiveTestCaseData & TData : TData
];
