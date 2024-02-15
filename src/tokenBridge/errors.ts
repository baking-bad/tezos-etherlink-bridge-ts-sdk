import { TokenBridgeError } from '../common';
import type { EtherlinkToken } from '../etherlink';
import type { TezosToken } from '../tezos';
import { tokenUtils } from '../utils';

export class TokenPairNotFoundError extends TokenBridgeError {
  constructor(token: TezosToken | EtherlinkToken) {
    super(TokenPairNotFoundError.getMessage(token));
  }

  private static getMessage(token: TezosToken | EtherlinkToken): string {
    return `Token pair not found for the ${tokenUtils.toDisplayString(token)} token`;
  }
} 
