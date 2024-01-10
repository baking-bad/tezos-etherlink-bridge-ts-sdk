import type { TokenDepositToRollupTzktTransaction, TokenWithdrawalFromRollupTzktOutboxMessageExecution, TokenWithdrawalFromRollupTzktTransaction, TzktTransaction } from './tzktOperations';
import { RemoteService } from '../../../../common';

const rollupAddressPrefix = 'sr1';

export class TzktBridgeDataProvider extends RemoteService {
  constructor(readonly baseUrl: string) {
    super(baseUrl);
  }

  async getTezosTokenDeposits(userAddress: string, rollupAddress: string, offset?: number, limit?: number): Promise<TokenDepositToRollupTzktTransaction[]> {
    const queryParams = new URLSearchParams({
      'target.eq': rollupAddress,
      'initiator.eq': userAddress,
      'entrypoint.eq': 'default',
      'sort.desc': 'id'
    });
    if (offset !== undefined && offset !== null)
      queryParams.append('offset', offset.toString());
    if (limit !== undefined && limit !== null)
      queryParams.append('limit', limit.toString());

    const transactions = await this.fetch<TokenDepositToRollupTzktTransaction[]>(`v1/operations/transactions?${queryParams.toString()}`, 'json');

    return transactions;
  }

  async getTezosTokenDepositByOperationHash(operationHash: string): Promise<TokenDepositToRollupTzktTransaction | null> {
    const transactions = await this.fetch<TzktTransaction[]>(`v1/operations/transactions/${operationHash}`, 'json');
    const lastTransaction = transactions[transactions.length - 1] as TokenDepositToRollupTzktTransaction | undefined;

    return lastTransaction && lastTransaction.target.address.startsWith(rollupAddressPrefix) && lastTransaction.parameter?.value?.LL?.ticket
      ? lastTransaction
      : null;
  }

  async getTezosTokenWithdrawals(userAddress: string, rollupAddress: string, offset?: number, limit?: number): Promise<TokenWithdrawalFromRollupTzktTransaction[]> {
    const queryParams = new URLSearchParams({
      'sender.eq': rollupAddress,
      'initiator.eq': userAddress,
      'entrypoint.eq': 'withdraw',
      'sort.desc': 'id'
    });
    if (offset !== undefined && offset !== null)
      queryParams.append('offset', offset.toString());
    if (limit !== undefined && limit !== null)
      queryParams.append('limit', limit.toString());

    const transactions = await this.fetch<TokenWithdrawalFromRollupTzktTransaction[]>(`v1/operations/transactions?${queryParams.toString()}`, 'json');

    return transactions;
  }

  async getTezosTokenWithdrawalByOperationHash(operationHash: string): Promise<TokenWithdrawalFromRollupTzktTransaction | null> {
    const transactions = await this.fetch<TzktTransaction[]>(`v1/operations/transactions/${operationHash}`, 'json');

    return (transactions.find(t => t.type === 'transaction' && t.sender.address.startsWith(rollupAddressPrefix)
      && (t as TokenWithdrawalFromRollupTzktTransaction).parameter?.value?.ticket) as TokenWithdrawalFromRollupTzktTransaction | undefined) || null;
  }

  async getTezosTokenWithdrawalOutboxMessageExecution(userAddress: string, rollupAddress: string, offset?: number, limit?: number): Promise<TokenWithdrawalFromRollupTzktOutboxMessageExecution[]> {
    const queryParams = new URLSearchParams({
      'rollup.eq': rollupAddress,
      'sender.eq': userAddress,
      'sort.desc': 'id'
    });
    if (offset !== undefined && offset !== null)
      queryParams.append('offset', offset.toString());
    if (limit !== undefined && limit !== null)
      queryParams.append('limit', limit.toString());

    const execution = await this.fetch<TokenWithdrawalFromRollupTzktOutboxMessageExecution[]>(`v1/operations/sr_execute?${queryParams.toString()}`, 'json');

    return execution;
  }

  async getTezosTokenWithdrawalOutboxMessageExecutionByOperationHash(operationHash: string): Promise<TokenWithdrawalFromRollupTzktOutboxMessageExecution | null> {
    const transactions = await this.fetch<any[]>(`v1/operations/transactions/${operationHash}`, 'json');

    return transactions.find(t => (t as TokenWithdrawalFromRollupTzktOutboxMessageExecution).type === 'sr_execute') || null;
  }
}
