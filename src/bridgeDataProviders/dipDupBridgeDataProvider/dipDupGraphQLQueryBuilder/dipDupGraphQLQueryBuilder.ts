import { bridgeDepositFields, bridgeWithdrawalFields, getBridgeOperationsFields, l2TokenHolderFields } from './queryParts';
import { etherlinkUtils } from '../../../utils';

type GraphQLQuery = string;

interface DipDupGraphQLQueryBuilderQueryParts {
  readonly getBridgeOperationsFields: typeof getBridgeOperationsFields,
  readonly bridgeDepositFields: string;
  readonly bridgeWithdrawalFields: string;
  readonly l2TokenHolderFields: string;
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

  getTokenTransferQuery(operationHash: string): GraphQLQuery {
    return this.getTokenTransferQueryOrSubscription(operationHash, true);
  }

  getTokenTransferSubscription(operationHash: string): GraphQLQuery {
    return this.getTokenTransferQueryOrSubscription(operationHash, false);
  }

  getTokenTransfersQuery(
    addressOrAddresses: string | readonly string[] | undefined | null,
    offset: number,
    limit: number
  ): string {
    return this.getTokenTransfersQueryOrSteamSubscription(
      addressOrAddresses,
      'query',
      'bridge_operation',
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

  protected getTokenTransferQueryOrSubscription(operationHash: string, isQuery: boolean): GraphQLQuery {
    const queryType = isQuery ? 'query' : 'subscription';
    let whereArgument: string;

    if (this.isEtherlinkTransaction(operationHash)) {
      operationHash = this.prepareEtherlinkHexValue(operationHash, false);
      whereArgument = `where: {
        _or : [
          { withdrawal: { l2_transaction: { transaction_hash: { _eq: "${operationHash}" } } } }
          { deposit: { l2_transaction: { transaction_hash: { _eq: "${operationHash}" } } } }
        ]
      }`;
    }
    else {
      whereArgument = `where: {
        _or : [
          { deposit: { l1_transaction: { operation_hash: { _eq: "${operationHash}" } } } }
          { withdrawal: { l1_transaction: { operation_hash: { _eq: "${operationHash}" } } } }
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
    queryExtraArguments: string
  ): GraphQLQuery {
    let whereArgument = '';

    if (addressOrAddresses) {
      if (typeof addressOrAddresses === 'string' || (addressOrAddresses.length === 1)) {
        const address = typeof addressOrAddresses === 'string' ? addressOrAddresses : addressOrAddresses[0]!;
        whereArgument = this.getTokenTransfersWhereArgumentForOneAddress(address);
      }
      else if (addressOrAddresses.length > 1) {
        whereArgument = this.getTokenTransfersWhereArgumentForMultipleAddresses(addressOrAddresses);
      }
    }

    if (whereArgument)
      whereArgument += ',';

    return `${queryType} TokenTransfers {
      ${rootFieldName}(
        ${whereArgument}
        ${queryExtraArguments}
      ) {
        ${this.queryParts.getBridgeOperationsFields(this.queryParts.bridgeDepositFields, this.queryParts.bridgeWithdrawalFields)}
      }
    }`;
  }

  private getTokenTransfersWhereArgumentForOneAddress(address: string): string {
    let accountFieldName: string;
    let preparedAddress = address;

    if (this.isEtherlinkAddress(address)) {
      preparedAddress = this.prepareEtherlinkHexValue(address, false);
      accountFieldName = 'l2_account';
    }
    else {
      accountFieldName = 'l1_account';
    }

    return `where: {
      _or: [
    	  { deposit: { l1_transaction: { ${accountFieldName}: { _eq: "${preparedAddress}" } } } }
        { withdrawal: { l2_transaction: { ${accountFieldName}: { _eq: "${preparedAddress}" } } } } 
      ]
    }`;
  }

  private getTokenTransfersWhereArgumentForMultipleAddresses(addresses: readonly string[]): string {
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

    return `where: { _or: [
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
    ] }`;
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
