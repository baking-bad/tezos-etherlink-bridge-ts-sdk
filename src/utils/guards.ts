import type { TokenBridgeService } from '../common';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const isArray = (arg: any): arg is any[] => {
  return Array.isArray(arg);
};

export const isReadonlyArray = (arg: unknown): arg is readonly unknown[] => {
  return Array.isArray(arg);
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const isTokenBridgeService = (arg: any): arg is TokenBridgeService => {
  return typeof arg.isStarted === 'boolean' && typeof arg.start === 'function' && typeof arg.stop === 'function';
};
