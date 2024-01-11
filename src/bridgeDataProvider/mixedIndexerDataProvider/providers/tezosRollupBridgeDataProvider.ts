import { RemoteService } from '../../../common';

interface RollupData {
  readonly commitment: string;
  readonly proof: string;
}

export class TezosRollupBridgeDataProvider extends RemoteService {
  constructor(readonly baseUrl: string) {
    super(baseUrl);
  }

  async getRollupData(outboxMessageLevel: string, outboxMessageId: string): Promise<RollupData | null> {
    try {
      const response = await this.fetch<RollupData>(`global/block/head/helpers/proofs/outbox/${outboxMessageLevel}/messages?index=${outboxMessageId}`, 'json');
      return response.commitment && response.proof ? response : null;
    } catch (error) {
      return null;
    }
  }
}
