import type { RPCNodeError } from './dto';
import { TokenBridgeError } from '../../../common';
import type { NativeEtherlinkToken } from '../../../tokens';
import { tokenUtils } from '../../../utils';

export class EtherlinkNodeTokenBalanceNotSupported extends TokenBridgeError {
  constructor(token: NativeEtherlinkToken) {
    super(`Etherlink Node won't be able to receive a balance of the ${tokenUtils.toDisplayString(token)}) token. Only native Etherlink token.`);
  }
}

export class EtherlinkNodeRPCError extends TokenBridgeError {
  constructor(error: RPCNodeError) {
    super(EtherlinkNodeRPCError.getMessage(error));
  }

  private static getMessage(error: RPCNodeError): string {
    return `RPC Error [Code: ${error.code}]. ${error.message}`;
  }
}
