import { TokenBridgeError } from '../../../common';
import type { TezosToken } from '../../../tokens';
import { tokenUtils } from '../../../utils';

export class TzKTTokenBalanceNotSupported extends TokenBridgeError {
  constructor(token: TezosToken) {
    super(`TzKT won't be able to receive a balance of the ${tokenUtils.toDisplayString(token)}) token. Only Tezos tokens.`);
  }
}
