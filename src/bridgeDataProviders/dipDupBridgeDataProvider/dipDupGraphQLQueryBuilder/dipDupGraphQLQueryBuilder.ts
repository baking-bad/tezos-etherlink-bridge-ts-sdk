import { bridgeDepositFields, bridgeWithdrawalFields, getBridgeOperationsFields, l2TokenHolderFields } from './queryParts';
import { etherlinkUtils, guards, memoize } from '../../../utils';

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
    protected readonly queryParts: DipDupGraphQLQueryBuilderQueryParts = DipDupGraphQLQueryBuilder.defaultQueryParts
  ) {
  }

  getTokenTransferQuery(operationHash: string): GraphQLQuery {
    return this.getTokenTransferQueryOrSubscription(operationHash, true);
  }

  getTokenTransferSubscriptions(operationHash: string): readonly [deposit: GraphQLQuery, withdrawal: GraphQLQuery] {
    return [
      this.getTokenTransferQueryOrSubscription(operationHash, false, true),
      this.getTokenTransferQueryOrSubscription(operationHash, false, false),
    ];
  }

  getTokenTransfersQuery(
    addressOrAddresses: string | readonly string[] | undefined | null,
    _offset: number,
    _limit: number
  ): string {
    // TODO: Support the limit and offset when DipDup returns an array of union of bridge_deposit and bridge_withdrawal records.

    let depositWhereArgument = '';
    let withdrawalWhereArgument = '';

    if (addressOrAddresses) {
      if (typeof addressOrAddresses === 'string' || (addressOrAddresses.length === 1)) {
        const address = typeof addressOrAddresses === 'string' ? addressOrAddresses : addressOrAddresses[0]!;
        depositWhereArgument = this.getWhereArgumentForOneAddress(address, true);
        withdrawalWhereArgument = this.getWhereArgumentForOneAddress(address, false);
      }
      else if (addressOrAddresses.length > 1) {
        depositWhereArgument = this.getWhereArgumentForMultipleAddresses(addressOrAddresses, true);
        withdrawalWhereArgument = this.getWhereArgumentForMultipleAddresses(addressOrAddresses, false);
      }
    }

    if (depositWhereArgument)
      depositWhereArgument = ', ' + depositWhereArgument;
    if (withdrawalWhereArgument)
      withdrawalWhereArgument = ', ' + withdrawalWhereArgument;

    return `query TokenTransfers {
      bridge_deposit(
        order_by: { l1_transaction: { timestamp: desc } }
        ${depositWhereArgument}
      ) {
        ${this.queryParts.bridgeDepositFields}
      }
      bridge_withdrawal(
        order_by: { l2_transaction: { timestamp: desc } }
        ${withdrawalWhereArgument}
      ) {
        ${this.queryParts.bridgeWithdrawalFields}
      }
    }`;
  }

  getTokenTransfersSubscriptions(addressOrAddresses: string | readonly string[] | undefined | null): GraphQLQuery[] {
    const queries: GraphQLQuery[] = [];

    if (guards.isReadonlyArray(addressOrAddresses)) {
      for (const address of addressOrAddresses) {
        queries.push(this.getAccountTokenTransfersSubscription(address, true));
        queries.push(this.getAccountTokenTransfersSubscription(address, false));
      }
    }
    else {
      queries.push(this.getAccountTokenTransfersSubscription(addressOrAddresses, true));
      queries.push(this.getAccountTokenTransfersSubscription(addressOrAddresses, false));
    }

    return queries;
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
      token: { _in: ${this.arrayToInOperatorValue(tokenAddresses)} }
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

  protected getTokenTransferQueryOrSubscription(operationHash: string, isQuery: true): GraphQLQuery;
  protected getTokenTransferQueryOrSubscription(operationHash: string, isQuery: false, isDeposit: boolean): GraphQLQuery;
  protected getTokenTransferQueryOrSubscription(operationHash: string, isQuery: boolean, isDeposit?: boolean): GraphQLQuery {
    let whereArgument: string;

    if (this.isEtherlinkTransaction(operationHash)) {
      operationHash = this.prepareEtherlinkHexValue(operationHash, false);
      whereArgument = `where: {
        l2_transaction: { transaction_hash: { _eq: "${operationHash}" } }
      }`;
    }
    else {
      whereArgument = `where: {
        l1_transaction: { operation_hash: { _eq: "${operationHash}" } }
      }`;
    }

    return isQuery
      ? `query TokenTransfer {
          bridge_deposit(${whereArgument}) {
            ${this.queryParts.bridgeDepositFields}
          }
          bridge_withdrawal(${whereArgument}) {
            ${this.queryParts.bridgeWithdrawalFields}
          }
        }`
      : isDeposit
        ? `subscription TokenTransfer {
            bridge_deposit(${whereArgument}) {
              ${this.queryParts.bridgeDepositFields}
            }
          }`
        : `subscription TokenTransfer {
          bridge_withdrawal(${whereArgument}) {
            ${this.queryParts.bridgeWithdrawalFields}
          }
        }`;
  }

  protected getAccountTokenTransfersSubscription(address: string | undefined | null, isDeposit: boolean): GraphQLQuery {
    const whereArgument = address ? `, ${this.getWhereArgumentForOneAddress(address, isDeposit)}` : '';
    let rootFieldName: string;
    let fields: string;

    if (isDeposit) {
      rootFieldName = 'bridge_deposit';
      fields = this.queryParts.bridgeDepositFields;
    }
    else {
      rootFieldName = 'bridge_withdrawal';
      fields = this.queryParts.bridgeWithdrawalFields;
    }

    return `subscription TokenTransfers {
      ${rootFieldName}(
        order_by: { updated_at: desc },
        limit: 1
        ${whereArgument}
      ) {
        ${fields}
      }
    }`;
  }

  private getWhereArgumentForOneAddress(address: string, isDeposit: boolean): string {
    return this.isEtherlinkAddress(address)
      ?
      `where: {
        ${isDeposit ? 'l1_transaction' : 'l2_transaction'}: { l2_account: { _eq: "${this.prepareEtherlinkHexValue(address, false)}" } }
      }`
      :
      `where: {
        ${isDeposit ? 'l1_transaction' : 'l2_transaction'}: { l1_account: { _eq: "${address}" } }
      }`;
  }

  private getWhereArgumentForMultipleAddresses(addresses: readonly string[], isDeposit: boolean): string {
    const { tezosAddresses, etherlinkAddresses } = this.splitAddressesToTezosAndEtherlinkAddresses(addresses);
    const isNeedOrOperator = tezosAddresses.length > 0 && etherlinkAddresses.length > 0;

    let result = 'where: ';
    if (isNeedOrOperator)
      result += ' { _or: [';

    if (tezosAddresses.length === 1) {
      result += `{
        ${isDeposit ? 'l1_transaction' : 'l2_transaction'}: { l1_account: { _eq: "${tezosAddresses[0]}" } }
      }`;
    } else if (tezosAddresses.length > 1) {
      result += `{
        ${isDeposit ? 'l1_transaction' : 'l2_transaction'}: { l1_account: { _in: ${this.arrayToInOperatorValue(tezosAddresses)} } }
      }`;
    }

    if (isNeedOrOperator)
      result += ',';

    if (etherlinkAddresses.length === 1) {
      result += `{
        ${isDeposit ? 'l1_transaction' : 'l2_transaction'}: { l2_account: { 
          _eq: "${this.prepareEtherlinkHexValue(etherlinkAddresses[0]!, false)}"
        } }
      }`;
    } else if (etherlinkAddresses.length > 1) {
      result += `{
        ${isDeposit ? 'l1_transaction' : 'l2_transaction'}: { l2_account: {
          _in: ${this.arrayToInOperatorValue(etherlinkAddresses.map(address => this.prepareEtherlinkHexValue(address, false)))}
        } }
      }`;
    }

    if (isNeedOrOperator)
      result += ' ] }';

    return result;
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
