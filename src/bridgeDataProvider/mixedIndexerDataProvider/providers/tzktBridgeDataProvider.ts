import { type BridgeTokenDeposit, BridgeTokenTransferKind } from '../../../bridgeOperations';
import { RemoteService } from '../../../common';
import { TezosToken } from '../../../tezos';

interface TzktTransaction {
  readonly type: 'transaction',
  readonly id: number,
  readonly level: number,
  readonly timestamp: string,
  readonly block: string,
  readonly hash: string,
  readonly counter: number,
  readonly initiator: {
    readonly address: string
  },
  readonly sender: {
    readonly address: string
  },
  readonly senderCodeHash: number,
  readonly nonce: number,
  readonly gasLimit: number,
  readonly gasUsed: number,
  readonly storageLimit: number,
  readonly storageUsed: number,
  readonly bakerFee: number,
  readonly storageFee: number,
  readonly allocationFee: number,
  readonly target: {
    readonly address: string
  },
  readonly targetCodeHash: number,
  readonly amount: number,
  readonly parameter: unknown,
  readonly status: 'applied' | 'failed ' | 'backtracked' | 'skipped ',
  readonly hasInternals: boolean
}

interface TokenDepositTzktTransaction extends TzktTransaction {
  readonly parameter: {
    readonly entrypoint: 'deposit',
    readonly value: string
  },
}

export class TzktBridgeDataProvider extends RemoteService {
  constructor(readonly baseUrl: string) {
    super(baseUrl);
  }

  async getTezosTokenDeposits(
    userAddress: string,
    token: TezosToken,
    ticketerContractAddress: string,
    offset?: number,
    limit?: number
  ): Promise<BridgeTokenDeposit[]> {
    const queryParams = new URLSearchParams({
      'target.eq': ticketerContractAddress,
      'initiator.eq': userAddress,
      'entrypoint.eq': 'deposit'
    });
    if (offset !== undefined && offset !== null)
      queryParams.append('offset', offset.toString());
    if (limit !== undefined && limit !== null)
      queryParams.append('limit', limit.toString());

    const transactions = await this.fetch<TokenDepositTzktTransaction[]>(`v1/operations/transactions?target.eq=${queryParams.toString()}`, 'json');

    return transactions.map<BridgeTokenDeposit>(tzktTransaction => ({
      kind: BridgeTokenTransferKind.Deposit,
      tezosOperation: {
        blockId: tzktTransaction.level,
        hash: tzktTransaction.hash,
        timestamp: tzktTransaction.timestamp,
        token,
        amount: BigInt(tzktTransaction.parameter.value),
        // TODO: calculate fee
        fee: 0n,
        sender: tzktTransaction.sender.address,
        source: tzktTransaction.initiator.address,
        // TODO: get the corresponding ticket and extract receiver
        receiver: ''
      }
    }));
  }
}
