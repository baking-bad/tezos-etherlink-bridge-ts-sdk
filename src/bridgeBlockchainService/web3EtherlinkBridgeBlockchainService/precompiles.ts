import type { Contract } from 'web3';

import { kernelContractAbi } from '../etherlinkBridgeBlockchainService';

export type WithdrawNonNativeTokenPrecompile = Contract<typeof kernelContractAbi>;
