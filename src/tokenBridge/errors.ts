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

export class InsufficientBalanceError extends TokenBridgeError {
  constructor(token: TezosToken | EtherlinkToken, address: string, balance: bigint, requested: bigint) {
    super(InsufficientBalanceError.getMessage(token, address, balance, requested));
  }

  private static getMessage(token: TezosToken | EtherlinkToken, address: string, balance: bigint, requested: bigint): string {
    return `${address} has an insufficient balance ${tokenUtils.toDisplayString(token)}. Balance = ${balance}. Requested = ${requested}`;
  }
}
