import { TokenBridgeError } from '../../common';

export class TezosSignerAccountUnavailableError extends TokenBridgeError {
  constructor() {
    super('The Tezos signer account is unavailable');
  }
}
