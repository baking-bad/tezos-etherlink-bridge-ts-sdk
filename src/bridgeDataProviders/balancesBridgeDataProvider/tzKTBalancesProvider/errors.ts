import { TokenBridgeError } from '../../../common';
import type { NonNativeTezosToken, TezosToken } from '../../../tezos';
import { guards, tokenUtils } from '../../../utils';

export class TzKTTokenBalanceNotSupported extends TokenBridgeError {
  constructor(token: TezosToken) {
    super(`TzKT won't be able to receive a balance of the ${tokenUtils.toDisplayString(token)}) token. Only Tezos tokens.`);
  }
}

export class TzKTNotPossibleReceiveBalances extends TokenBridgeError {
  constructor(address: string, tokenOrTokens: NonNativeTezosToken | readonly NonNativeTezosToken[] | null | undefined) {
    super(TzKTNotPossibleReceiveBalances.getMessage(address, tokenOrTokens));
  }

  private static getMessage(
    address: string,
    tokenOrTokens: NonNativeTezosToken | readonly NonNativeTezosToken[] | null | undefined
  ): string {
    return tokenOrTokens
      ? guards.isReadonlyArray(tokenOrTokens)
        ? `It's not possible to receive balances of the ${tokenUtils.toDisplayString(tokenOrTokens)} tokens for the ${address} address`
        : `It's not possible to receive balance of the ${tokenUtils.toDisplayString(tokenOrTokens)} token for the ${address} address`
      : `It's not possible to receive balances for all tokens for the ${address} address`;
  }

}
