import type { GraphQLError } from './dtos';
import { TokenBridgeError } from '../../common';

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
