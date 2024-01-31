import type { NativeEtherlinkToken, ERC20EtherlinkToken } from '../etherlink';
import type { NativeTezosToken, FA12TezosToken, FA2TezosToken } from '../tezos';

interface NativeTezosTokenTicketerInfo {
  readonly ticketerContractAddress: string;
}

interface NonNativeTezosTokenTicketerInfo {
  readonly ticketerContractAddress: string;
  readonly tickerHelperContractAddress: string;
}

type TezosTokenInfo =
  | NativeTezosToken & NativeTezosTokenTicketerInfo
  | FA12TezosToken & NonNativeTezosTokenTicketerInfo
  | FA2TezosToken & NonNativeTezosTokenTicketerInfo;

type EtherlinkTokenInfo =
  | NativeEtherlinkToken
  | ERC20EtherlinkToken;

export type TokenPair = {
  readonly tezos: TezosTokenInfo;
  readonly etherlink: EtherlinkTokenInfo;
};
