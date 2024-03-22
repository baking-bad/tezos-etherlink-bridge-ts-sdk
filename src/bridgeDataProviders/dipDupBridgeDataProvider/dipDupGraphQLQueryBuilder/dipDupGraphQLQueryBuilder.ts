import { bridgeDepositFields, bridgeWithdrawalFields, getBridgeOperationsFields, l2TokenHolderFields } from './queryParts';
import { etherlinkUtils } from '../../../utils';

type GraphQLQuery = string;

interface DipDupGraphQLQueryBuilderQueryParts {
  readonly getBridgeOperationsFields: typeof getBridgeOperationsFields,
  readonly bridgeDepositFields: string;
  readonly bridgeWithdrawalFields: string;
  readonly l2TokenHolderFields: string;
}

export interface GraphQLTransfersFilter {
  type?: Array<'deposit' | 'withdrawal'> | null;
  status?: Array<'Created' | 'Sealed' | 'Finished' | 'Failed'> | null;
}

export class DipDupGraphQLQueryBuilder {
  protected static readonly defaultQueryParts: DipDupGraphQLQueryBuilderQueryParts = {
    getBridgeOperationsFields,
    bridgeDepositFields,
    bridgeWithdrawalFields,
    l2TokenHolderFields
  };

  constructor(
    protected readonly queryParts: DipDupGraphQLQueryBuilderQueryParts = DipDupGraphQLQueryBuilder.defaultQueryParts,
    protected readonly defaultStreamSubscriptionBatchSize = 10
  ) {
  }

  getTokenTransferQuery(etherlinkOperationHash: string, logIndex: number): GraphQLQuery;
  getTokenTransferQuery(tezosOperationHash: string, counter: number, nonce: number | null): GraphQLQuery;
  getTokenTransferQuery(operationHash: string, counterOrLogIndex?: number, nonce?: number | null): GraphQLQuery;
  getTokenTransferQuery(operationHash: string, counterOrLogIndex?: number, nonce?: number | null): GraphQLQuery {
    return this.getOperationTokenTransfersQueryOrSubscription(true, operationHash, counterOrLogIndex, nonce);
  }

  getTokenTransferSubscription(etherlinkOperationHash: string, logIndex: number): GraphQLQuery;
  getTokenTransferSubscription(tezosOperationHash: string, counter: number, nonce: number | null): GraphQLQuery;
  getTokenTransferSubscription(operationHash: string, counterOrLogIndex?: number, nonce?: number | null): GraphQLQuery;
  getTokenTransferSubscription(operationHash: string, counterOrLogIndex?: number, nonce?: number | null): GraphQLQuery {
    return this.getOperationTokenTransfersQueryOrSubscription(false, operationHash, counterOrLogIndex, nonce);
  }

  getOperationTokenTransfersQuery(operationHash: string): GraphQLQuery {
    return this.getOperationTokenTransfersQueryOrSubscription(true, operationHash);
  }

  getOperationTokenTransfersSubscription(operationHash: string): GraphQLQuery {
    return this.getOperationTokenTransfersQueryOrSubscription(false, operationHash);
  }

  getTokenTransfersQuery(
    addressOrAddresses: string | readonly string[] | undefined | null,
    offset: number,
    limit: number,
    filter?: GraphQLTransfersFilter | undefined | null
  ): string {
    return this.getTokenTransfersQueryOrSteamSubscription(
      addressOrAddresses,
      'query',
      'bridge_operation',
      this.getTransfersFilterWhereCondition(filter),
      `order_by: { created_at: desc }, offset: ${offset}, limit: ${limit}`
    );
  }

  getTokenTransfersStreamSubscription(
    addressOrAddresses: string | readonly string[] | undefined | null,
    startUpdatedAt: Date,
    batchSize = this.defaultStreamSubscriptionBatchSize
  ): GraphQLQuery {
    return this.getTokenTransfersQueryOrSteamSubscription(
      addressOrAddresses,
      'subscription',
      'bridge_operation_stream',
      undefined,
      `batch_size: ${batchSize}, cursor: {initial_value: {updated_at: "${startUpdatedAt.toISOString()}"}, ordering: ASC}`
    );
  }

  getAllTokenBalancesQuery(accountAddress: string, offset: number, limit: number): GraphQLQuery {
    const whereArgument = `where: {
      holder: { _eq: "${this.prepareEtherlinkHexValue(accountAddress, true)}" }
    }`;

    return `query TokenBalance {
      l2_token_holder(${whereArgument}, offset: ${offset}, limit: ${limit}) {
        ${l2TokenHolderFields}
      }
    }`;
  }

  getTokenBalancesQuery(accountAddress: string, tokenAddresses: readonly string[]): GraphQLQuery {
    const whereArgument = `where: {
      holder: { _eq: "${this.prepareEtherlinkHexValue(accountAddress, true)}" },
      token: { _in: ${this.arrayToInOperatorValue(tokenAddresses.map(address => this.prepareEtherlinkHexValue(address, true)))} }
    }`;

    return `query TokenBalance {
      l2_token_holder(${whereArgument}) {
        ${l2TokenHolderFields}
      }
    }`;
  }

  getTokenBalanceQuery(accountAddress: string, tokenAddress: string): GraphQLQuery {
    const whereArgument = `where: {
      holder: { _eq: "${this.prepareEtherlinkHexValue(accountAddress, true)}" },
      token: { _eq: "${this.prepareEtherlinkHexValue(tokenAddress, true)}" }
    }`;

    return `query TokenBalance {
      l2_token_holder(${whereArgument}) {
        ${l2TokenHolderFields}
      }
    }`;
  }

  protected getOperationTokenTransfersQueryOrSubscription(isQuery: boolean, operationHash: string): GraphQLQuery;
  protected getOperationTokenTransfersQueryOrSubscription(isQuery: boolean, etherlinkOperationHash: string, logIndex: number): GraphQLQuery;
  protected getOperationTokenTransfersQueryOrSubscription(isQuery: boolean, tezosOperationHash: string, counter: number, nonce: number | null): GraphQLQuery;
  protected getOperationTokenTransfersQueryOrSubscription(isQuery: boolean, operationHash: string, counterOrLogIndex?: number, nonce?: number | null): GraphQLQuery;
  protected getOperationTokenTransfersQueryOrSubscription(isQuery: boolean, operationHash: string, counterOrLogIndex?: number, nonce?: number | null): GraphQLQuery {
    const queryType = isQuery ? 'query' : 'subscription';
    let whereArgument: string;

    if (this.isEtherlinkTransaction(operationHash)) {
      operationHash = this.prepareEtherlinkHexValue(operationHash, false);
      const logIndexCondition = typeof counterOrLogIndex === 'number'
        ? `log_index: { _eq: ${counterOrLogIndex} }`
        : '';
      const l2TransactionCondition = `l2_transaction: {
        transaction_hash: { _eq: "${operationHash}" }
        ${logIndexCondition}
      }`;

      whereArgument = `where: {
        _or : [
          { withdrawal: { ${l2TransactionCondition} } }
          { deposit: { ${l2TransactionCondition} } }
        ]
      }`;
    }
    else {
      const counterCondition = typeof counterOrLogIndex === 'number'
        ? `counter: { _eq: ${counterOrLogIndex} }`
        : '';
      const nonceCondition = typeof nonce === 'number'
        ? `nonce: { _eq: ${nonce} }`
        : '';
      const l1TransactionCondition = `l1_transaction: {
        operation_hash: { _eq: "${operationHash}" }
        ${counterCondition}
        ${nonceCondition}
      }`;

      whereArgument = `where: {
        _or : [
          { deposit: { ${l1TransactionCondition} } }
          { withdrawal: { ${l1TransactionCondition} } }
        ]
      }`;
    }

    return `${queryType} TokenTransfer {
      bridge_operation(${whereArgument}) {
        ${this.queryParts.getBridgeOperationsFields(this.queryParts.bridgeDepositFields, this.queryParts.bridgeWithdrawalFields)}
      }
    }`;
  }

  protected getTokenTransfersQueryOrSteamSubscription(
    addressOrAddresses: string | readonly string[] | undefined | null,
    queryType: string,
    rootFieldName: string,
    transfersFilterWhereCondition: string | undefined | null,
    queryExtraArguments: string
  ): GraphQLQuery {
    const addressOrAddressesWhereCondition = this.getTokenTransfersByAddressOrAddressesWhereCondition(addressOrAddresses);
    const whereArgument = transfersFilterWhereCondition && addressOrAddressesWhereCondition
      ? `where: { ${transfersFilterWhereCondition}, ${addressOrAddressesWhereCondition} },`
      : transfersFilterWhereCondition
        ? `where: { ${transfersFilterWhereCondition} },`
        : addressOrAddressesWhereCondition
          ? `where: { ${addressOrAddressesWhereCondition} },`
          : '';

    return `${queryType} TokenTransfers {
      ${rootFieldName}(
        ${whereArgument}
        ${queryExtraArguments}
      ) {
        ${this.queryParts.getBridgeOperationsFields(this.queryParts.bridgeDepositFields, this.queryParts.bridgeWithdrawalFields)}
      }
    }`;
  }

  protected getTransfersFilterWhereCondition(filter: GraphQLTransfersFilter | undefined | null): string {
    if (!filter)
      return '';

    let condition = '';

    if (filter.type) {
      condition += filter.type.length === 1
        ? `type: { _eq: "${filter.type[0]}" }`
        : `type: { _in: ${this.arrayToInOperatorValue(filter.type)} }`;
    }

    if (filter.status) {
      if (condition)
        condition += ', ';

      condition += filter.status.length === 1
        ? `status: { _eq: "${filter.status[0]}" }`
        : `status: { _in: ${this.arrayToInOperatorValue(filter.status)} }`;
    }

    return condition;
  }

  private getTokenTransfersByAddressOrAddressesWhereCondition(addressOrAddresses: string | readonly string[] | undefined | null) {
    if (addressOrAddresses) {
      if (typeof addressOrAddresses === 'string' || (addressOrAddresses.length === 1)) {
        const address = typeof addressOrAddresses === 'string' ? addressOrAddresses : addressOrAddresses[0]!;
        return this.getTokenTransfersByOneAddressWhereCondition(address);
      }
      else if (addressOrAddresses.length > 1) {
        return this.getTokenTransfersByMultipleAddressesWhereCondition(addressOrAddresses);
      }
    }

    return '';
  }

  private getTokenTransfersByOneAddressWhereCondition(address: string): string {
    let accountFieldName: string;
    let preparedAddress = address;

    if (this.isEtherlinkAddress(address)) {
      preparedAddress = this.prepareEtherlinkHexValue(address, false);
      accountFieldName = 'l2_account';
    }
    else {
      accountFieldName = 'l1_account';
    }

    return `_or: [
      { deposit: { l1_transaction: { ${accountFieldName}: { _eq: "${preparedAddress}" } } } }
      { withdrawal: { l2_transaction: { ${accountFieldName}: { _eq: "${preparedAddress}" } } } } 
    ]`;
  }

  private getTokenTransfersByMultipleAddressesWhereCondition(addresses: readonly string[]): string {
    const { tezosAddresses, etherlinkAddresses } = this.splitAddressesToTezosAndEtherlinkAddresses(addresses);
    const isNeedRootOrOperator = tezosAddresses.length > 0 && etherlinkAddresses.length > 0;

    let transactionCondition = '';
    if (isNeedRootOrOperator)
      transactionCondition += '{ _or: [ ';

    if (tezosAddresses.length === 1) {
      transactionCondition += `{ l1_account: { _eq: "${tezosAddresses[0]}" } }`;
    }
    else if (tezosAddresses.length > 1) {
      transactionCondition += `{ l1_account: { _in: ${this.arrayToInOperatorValue(tezosAddresses)} } }`;
    }

    if (etherlinkAddresses.length === 1) {
      transactionCondition += `{ l2_account: { _eq: "${this.prepareEtherlinkHexValue(etherlinkAddresses[0]!, false)}" } }`;
    }
    else if (etherlinkAddresses.length > 1) {
      transactionCondition += `{ l2_account: { _in: ${this.arrayToInOperatorValue(etherlinkAddresses.map(address => this.prepareEtherlinkHexValue(address, false)))} } }`;
    }

    if (isNeedRootOrOperator)
      transactionCondition += ' ] }';

    return `_or: [
      {
        deposit: { 
          l1_transaction: ${transactionCondition}
        }  
      }
      {
        withdrawal: {
          l2_transaction: ${transactionCondition}
        }
      }
    ]`;
  }

  private splitAddressesToTezosAndEtherlinkAddresses(
    addresses: readonly string[]
  ): { tezosAddresses: string[], etherlinkAddresses: string[] } {
    const tezosAddresses = [];
    const etherlinkAddresses = [];

    for (const address of addresses) {
      if (this.isEtherlinkAddress(address))
        etherlinkAddresses.push(address);
      else
        tezosAddresses.push(address);
    }

    return {
      tezosAddresses,
      etherlinkAddresses
    };
  }

  private isEtherlinkTransaction(operationHash: string) {
    return operationHash.length === 66 && operationHash.startsWith('0x');
  }

  private isEtherlinkAddress(address: string) {
    return address.startsWith('0x');
  }

  private prepareEtherlinkHexValue(value: string, includePrefix: boolean): string {
    return etherlinkUtils.prepareHexPrefix(value, includePrefix).toLowerCase();
  }

  private arrayToInOperatorValue(array: readonly string[]): string {
    return array.reduce(
      (acc, item, index) => {
        let result = acc + `"${item}"`;
        if (index < array.length - 1)
          result += ',';

        return result;
      },
      '['
    ) + ']';
  }
}
