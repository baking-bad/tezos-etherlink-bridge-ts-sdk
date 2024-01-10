export type TzktOperationStatus = 'applied' | 'failed ' | 'backtracked' | 'skipped ';

export interface TzktTransaction {
  readonly type: 'transaction';
  readonly id: number;
  readonly level: number;
  readonly timestamp: string;
  readonly block: string;
  readonly hash: string;
  readonly counter: number;
  readonly initiator: {
    readonly address: string;
  };
  readonly sender: {
    readonly address: string;
  };
  readonly senderCodeHash: number;
  readonly nonce: number;
  readonly gasLimit: number;
  readonly gasUsed: number;
  readonly storageLimit: number;
  readonly storageUsed: number;
  readonly bakerFee: number;
  readonly storageFee: number;
  readonly allocationFee: number;
  readonly target: {
    readonly address: string;
  },
  readonly targetCodeHash: number;
  readonly amount: number;
  readonly parameter: unknown;
  readonly status: TzktOperationStatus;
  readonly hasInternals: boolean;
}

export interface RollupTokenTicket {
  readonly data: {
    readonly nat: number;
    readonly bytes: string;
  };
  readonly amount: string;
  readonly address: string;
}

export interface TokenDepositToRollupTzktTransaction extends TzktTransaction {
  readonly parameter: {
    readonly entrypoint: 'default';
    readonly value: {
      readonly LL: {
        readonly bytes: string;
        readonly ticket: RollupTokenTicket;
      }
    }
  };
  readonly ticketTransfersCount: number;
}

export interface TokenWithdrawalFromRollupTzktTransaction extends TzktTransaction {
  readonly parameter: {
    readonly entrypoint: 'withdraw';
    readonly value: {
      readonly ticket: RollupTokenTicket;
      readonly receiver: string;
    }
  };
  readonly ticketTransfersCount: number;
}

export interface TokenWithdrawalFromRollupTzktOutboxMessageExecution {
  readonly type: 'sr_execute';
  readonly id: number;
  readonly level: number;
  readonly timestamp: string;
  readonly hash: string;
  readonly sender: {
    readonly address: string;
  },
  readonly counter: number;
  readonly gasLimit: number;
  readonly gasUsed: number;
  readonly storageLimit: number;
  readonly storageUsed: number;
  readonly bakerFee: number;
  readonly storageFee: number;
  readonly status: TzktOperationStatus;
  readonly rollup: {
    readonly address: string;
  };
  readonly commitment: {
    readonly id: number;
    readonly initiator: {
      readonly address: string;
    },
    readonly inboxLevel: number;
    readonly state: string;
    readonly hash: string;
    readonly ticks: number;
    readonly firstLevel: number;
    readonly firstTime: string;
  },
  readonly ticketTransfersCount: number;
}
