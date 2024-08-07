import type { Contract } from 'web3';

import { nativeTokenBridgePrecompile, nonNativeTokenBridgePrecompile } from '../etherlinkBridgeBlockchainService';

export type NativeTokenBridgePrecompile = Contract<typeof nativeTokenBridgePrecompile>;
export type NonNativeTokenBridgePrecompile = Contract<typeof nonNativeTokenBridgePrecompile>;
