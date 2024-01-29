import type { ERC20EtherlinkToken } from '../etherlink';
import type { FA12TezosToken, FA2TezosToken } from '../tezos';

interface TezosTokenTicketerInfo {
  readonly ticketerContractAddress: string;
  readonly tickerHelperContractAddress: string;
}

type TezosTokenInfo =
  | FA12TezosToken & TezosTokenTicketerInfo
  | FA2TezosToken & TezosTokenTicketerInfo;

type EtherlinkTokenInfo = ERC20EtherlinkToken;

export type TokenPair = {
  readonly tezos: TezosTokenInfo;
  readonly etherlink: EtherlinkTokenInfo;
};
