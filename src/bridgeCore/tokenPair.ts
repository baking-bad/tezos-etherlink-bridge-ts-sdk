import type {
  NativeTezosToken, FA12TezosToken, FA2TezosToken,
  NativeEtherlinkToken, ERC20EtherlinkToken
} from '../tokens';

interface NativeTezosTokenTicketerInfo {
  readonly ticketHelperContractAddress: string;
}

interface NonNativeTezosTokenTicketerInfo {
  readonly ticketerContractAddress: string;
  readonly ticketHelperContractAddress: string;
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
