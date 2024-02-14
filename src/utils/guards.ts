// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const isArray = (arg: any): arg is any[] => {
  return Array.isArray(arg);
};

export const isReadonlyArray = (arg: unknown): arg is readonly unknown[] => {
  return Array.isArray(arg);
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const isDisposable = (arg: any): arg is Disposable => {
  return typeof arg?.dispose === 'symbol';
};
