import type { EtherlinkToken } from '../etherlink';
import type { NativeTezosToken, NonNativeTezosToken } from '../tezos';

interface NativeTezosTokenInfo {
  readonly token: NativeTezosToken;
  readonly ticketerContractAddress: string;
}

interface NonNativeTezosTokenInfo {
  readonly token: NonNativeTezosToken;
  readonly ticketerContractAddress: string;
  readonly tickerHelperContractAddress: string;
}

type TezosTokenInfo = NativeTezosTokenInfo | NonNativeTezosTokenInfo;

interface EtherlinkTokenInfo {
  readonly token: EtherlinkToken;
}

export type TokenPairInfo = {
  readonly tezos: TezosTokenInfo;
  readonly etherlink: EtherlinkTokenInfo;
};
