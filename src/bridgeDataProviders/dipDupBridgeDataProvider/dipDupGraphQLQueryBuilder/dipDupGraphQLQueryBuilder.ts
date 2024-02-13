import { bridgeDepositFields, bridgeWithdrawalFields } from './queryParts';
import { etherlinkUtils } from '../../../utils';

type GraphQLQuery = string;

interface DipDupGraphQLQueryBuilderQueryParts {
  readonly bridgeDepositFields: string;
  readonly bridgeWithdrawalFields: string;
}

export class DipDupGraphQLQueryBuilder {
  protected static readonly defaultQueryParts: DipDupGraphQLQueryBuilderQueryParts = {
    bridgeDepositFields,
    bridgeWithdrawalFields
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

  protected getTokenTransferQueryOrSubscription(operationHash: string, isQuery: true): GraphQLQuery;
  protected getTokenTransferQueryOrSubscription(operationHash: string, isQuery: false, isDeposit: boolean): GraphQLQuery;
  protected getTokenTransferQueryOrSubscription(operationHash: string, isQuery: boolean, isDeposit?: boolean): GraphQLQuery {
    let whereArgument: string;

    if (this.isEtherlinkTransaction(operationHash)) {
      operationHash = this.prepareEtherlinkHexValue(operationHash);
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

  private getWhereArgumentForOneAddress(address: string, isDeposit: boolean): string {
    return this.isEtherlinkAddress(address)
      ?
      `where: {
        ${isDeposit ? 'l1_transaction' : 'l2_transaction'}: { l2_account: { _eq: "${this.prepareEtherlinkHexValue(address)}" } }
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
          _eq: "${this.prepareEtherlinkHexValue(etherlinkAddresses[0]!)}"
        } }
      }`;
    } else if (etherlinkAddresses.length > 1) {
      result += `{
        ${isDeposit ? 'l1_transaction' : 'l2_transaction'}: { l2_account: {
          _in: ${this.arrayToInOperatorValue(etherlinkAddresses.map(address => this.prepareEtherlinkHexValue(address)))}
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

  private prepareEtherlinkHexValue(value: string): string {
    return etherlinkUtils.prepareHexPrefix(value, false).toLowerCase();
  }

  private arrayToInOperatorValue<T>(array: readonly T[]): string {
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
