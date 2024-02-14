export { memoize } from './memoize';

/* eslint-disable @typescript-eslint/no-explicit-any */
export const emptyFunction: () => any = () => { };
export const emptyAsyncFunction: () => Promise<any> = async () => { };
/* eslint-enable @typescript-eslint/no-explicit-any */

export * as guards from './guards';
export * as textUtils from './textUtils';
export * as tezosUtils from './tezosUtils';
export * as etherlinkUtils from './etherlinkUtils';
export * as bridgeUtils from './bridgeUtils';
