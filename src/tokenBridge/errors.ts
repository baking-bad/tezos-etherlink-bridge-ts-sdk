import { TokenBridgeError } from '../common';
import type { EtherlinkToken } from '../etherlink';
import { getTokenLogMessage } from '../logging';
import type { TezosToken } from '../tezos';

export class TokenPairNotFoundError extends TokenBridgeError {
  constructor(token: TezosToken | EtherlinkToken, options?: ErrorOptions) {
    super(TokenPairNotFoundError.getMessage(token), options);
  }

  private static getMessage(token: TezosToken | EtherlinkToken): string {
    return `Token pair not found for the ${getTokenLogMessage(token)} token`;
  }
} 
