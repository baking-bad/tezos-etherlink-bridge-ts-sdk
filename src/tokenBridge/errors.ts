import type { BridgeTokenTransfer } from '../bridgeCore';
import { DisposedError, TokenBridgeError } from '../common';
import { getBridgeTokenTransferIdLogMessage } from '../logging';
import type { TezosToken, EtherlinkToken } from '../tokens';
import { tokenUtils } from '../utils';

export class TokenBridgeDisposed extends DisposedError {
  constructor() {
    super('The TokenBridge is disposed.');
  }
}

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

export class FailedTokenTransferError extends TokenBridgeError {
  constructor(tokenTransfer: BridgeTokenTransfer) {
    super(FailedTokenTransferError.getMessage(tokenTransfer));
  }

  private static getMessage(tokenTransfer: BridgeTokenTransfer): string {
    return `The ${getBridgeTokenTransferIdLogMessage(tokenTransfer)} token transfer is failed`;
  }
}

export class TezosSignerAccountUnavailableError extends TokenBridgeError {
  constructor() {
    super('The Tezos signer account is unavailable');
  }
}

export class EtherlinkSignerAccountUnavailableError extends TokenBridgeError {
  constructor() {
    super('The Etherlink signer account is unavailable');
  }
}
