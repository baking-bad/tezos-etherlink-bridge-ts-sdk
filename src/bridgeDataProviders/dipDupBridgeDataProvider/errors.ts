import type { GraphQLError } from './dtos';
import { TokenBridgeError } from '../../common';
import { TezosToken, EtherlinkToken } from '../../tokens';
import { tokenUtils } from '../../utils';

export class DipDupAutoUpdateIsDisabledError extends TokenBridgeError {
  constructor() {
    super('AutoUpdate is disabled for the DipDupBridgeDataProvider');
  }
}

export class DipDupGraphQLError extends TokenBridgeError {
  constructor(graphQLErrors: readonly GraphQLError[]) {
    super(DipDupGraphQLError.getMessage(graphQLErrors));
  }

  private static getMessage(graphQLErrors: readonly GraphQLError[]): string {
    return graphQLErrors.reduce((result, error, index) => `${result}\n  ${index + 1}. ${error.message};`, 'DipDup GraphQL Errors:');
  }
}

export class DipDupTokenBalanceNotSupported extends TokenBridgeError {
  constructor(token: TezosToken | EtherlinkToken) {
    super(`DipDup won't be able to receive a balance of the ${tokenUtils.toDisplayString(token)}) token. Only ERC-20 tokens.`);
  }
}

export class DipDupTokenTransferIdInvalid extends TokenBridgeError {
  constructor(tokenTransferId: string) {
    super(`The token transfer Id is invalid: ${tokenTransferId}`);
  }
}
