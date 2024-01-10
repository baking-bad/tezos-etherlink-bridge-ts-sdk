import type { GetTokenTransfersResponse, TokenTransfer } from './etherlinkOperations';
import { RemoteService } from '../../../../common';

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

  async getEtherlinkTokenWithdrawals(userAddress: string, kernelAddress: string, offset?: number, page?: number): Promise<TokenTransfer[]> {
    const queryParams = new URLSearchParams({
      module: 'account',
      action: 'tokentx',
      address: userAddress
    });
    if (offset !== undefined && offset !== null)
      queryParams.append('offset', offset.toString());
    if (page !== undefined && page !== null)
      queryParams.append('page', page.toString());

    const response = await this.fetch<GetTokenTransfersResponse>(`api?${queryParams.toString()}`, 'json');

    return response.result
      .filter(t => t.from === userAddress && t.to === kernelAddress && t.input.length > 2);
  }

  async getEtherlinkTokenWithdrawalByOperationHash(operationHash: string, kernelAddress: string): Promise<TokenTransfer | null> {
    // TODO: get operation using the gettxinfo action
    const tokenTransfers = await this.getEtherlinkTokenWithdrawals(kernelAddress, kernelAddress);

    return tokenTransfers.find(tt => tt.hash === operationHash) || null;
  }
}
