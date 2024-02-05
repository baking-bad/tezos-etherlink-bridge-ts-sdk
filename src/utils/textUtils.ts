export const trimSlashes = (value: string): string => {
  const hasFirst = value.startsWith('/');
  const hasLast = value.endsWith('/');

  return hasFirst && hasLast
    ? value.slice(1, -1)
    : hasFirst
      ? value.slice(1)
      : hasLast
        ? value.slice(0, -1)
        : value;
};
