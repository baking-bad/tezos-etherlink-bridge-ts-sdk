import { GetLogsResponse, Log } from './etherlinkLogs';
import type { GetTokenTransfersResponse, TokenTransfer } from './etherlinkOperations';
import { RemoteService } from '../../../../common';

const withdrawalLogTopic0 = '0x64e765b73c0829c01c6f3026a840120142d5a0b83626c548cff3a44ca5299c98';

export class BlockscoutBridgeDataProvider extends RemoteService {
  constructor(readonly baseUrl: string) {
    super(baseUrl);
  }

  async getEtherlinkTokenDeposits(kernelAddress: string, offset?: number, page?: number): Promise<TokenTransfer[]> {
    const queryParams = new URLSearchParams({
      module: 'account',
      action: 'tokentx',
      address: kernelAddress
    });
    if (offset !== undefined && offset !== null)
      queryParams.append('offset', offset.toString());
    if (page !== undefined && page !== null)
      queryParams.append('page', page.toString());

    const response = await this.fetch<GetTokenTransfersResponse>(`api?${queryParams.toString()}`, 'json');

    return response.result.filter(t => t.from === kernelAddress);
  }

  async getEtherlinkTokenDepositByOperationHash(operationHash: string, kernelAddress: string): Promise<TokenTransfer | null> {
    // TODO: get operation using the gettxinfo action
    const tokenTransfers = await this.getEtherlinkTokenDeposits(kernelAddress);

    return tokenTransfers.find(tt => tt.hash === operationHash) || null;
  }

  async getEtherlinkTokenWithdrawals(userAddress: string | null, kernelAddress: string, offset?: number, page?: number): Promise<TokenTransfer[]> {
    userAddress = userAddress && userAddress.toLocaleLowerCase();

    const queryParams = new URLSearchParams({
      module: 'account',
      action: 'tokentx',
      address: kernelAddress
    });
    if (offset !== undefined && offset !== null)
      queryParams.append('offset', offset.toString());
    if (page !== undefined && page !== null)
      queryParams.append('page', page.toString());

    const response = await this.fetch<GetTokenTransfersResponse>(`api?${queryParams.toString()}`, 'json');

    return response.result
      .filter(t => (!userAddress || t.from === userAddress) && t.to === kernelAddress && t.input.length > 2);
  }

  async getEtherlinkTokenWithdrawalByOperationHash(operationHash: string, kernelAddress: string): Promise<TokenTransfer | null> {
    // TODO: get operation using the gettxinfo action
    const tokenTransfers = await this.getEtherlinkTokenWithdrawals(null, kernelAddress);

    return tokenTransfers.find(tt => tt.hash === operationHash) || null;
  }

  async getEtherlinkTokenWithdrawalLogs(
    kernelAddress: string,
    fromBlock: string | number = 0,
    toBlock: string | number = 'latest'
  ): Promise<Log[]> {
    const queryParams = new URLSearchParams({
      module: 'logs',
      action: 'getLogs',
      fromBlock: fromBlock.toString(),
      toBlock: toBlock.toString(),
      address: kernelAddress,
      topic0: withdrawalLogTopic0
    });

    const response = await this.fetch<GetLogsResponse>(`api?${queryParams.toString()}`, 'json');

    return response.result as Log[];
  }
}
