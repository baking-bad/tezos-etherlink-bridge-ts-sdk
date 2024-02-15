import { BridgeTokenTransfer, BridgeTokenTransferKind, FinishedBridgeTokenDeposit } from '..';
import { EtherlinkToken } from '../etherlink';
import { TezosToken } from '../tezos';
import { bridgeUtils, tokenUtils } from '../utils';

export const getErrorLogMessage = (error: any): string => {
  if (!error)
    return `[error is ${error === null ? 'null' : 'undefined'}]`;

  if (typeof error === 'string')
    return error;
  else if (typeof error?.message === 'string')
    return error.message;

  return '[unknown error type]';
};

export const getTokenLogMessage = tokenUtils.toDisplayString;

export const getTokensLogMessage = (tokens: ReadonlyArray<TezosToken | EtherlinkToken>): string => {
  return tokens.reduce(
    (result, token, index, tokens) => result + getTokenLogMessage(token) + (index < tokens.length - 1 ? ', ' : ']'),
    '['
  );
};

const getNullOrUndefinedBridgeTokenTransferLogMessage = (bridgeTokenTransfer: null | undefined): string => {
  return `Bridge Token transfer is ${bridgeTokenTransfer === null ? 'null' : 'undefined'}`;
};

export const getBridgeTokenTransferLogMessage = (bridgeTokenTransfer: BridgeTokenTransfer | null | undefined): string => {
  return bridgeTokenTransfer
    ? `Bridge Token Transfer:
  Kind: ${BridgeTokenTransferKind[bridgeTokenTransfer.kind]}
  Status: ${BridgeTokenTransferKind[bridgeTokenTransfer.status]}
  Source: ${bridgeTokenTransfer.source}
  Receiver: ${bridgeTokenTransfer.receiver}
  Tezos operation hash: ${(bridgeTokenTransfer as FinishedBridgeTokenDeposit)?.tezosOperation?.hash}
  Etherlink operation hash: ${(bridgeTokenTransfer as FinishedBridgeTokenDeposit)?.etherlinkOperation?.hash}

`
    : getNullOrUndefinedBridgeTokenTransferLogMessage(bridgeTokenTransfer);
};

export const getDetailedBridgeTokenTransferLogMessage = (bridgeTokenTransfer: BridgeTokenTransfer | null | undefined): string => {
  return bridgeTokenTransfer
    ? `Bridge Token Transfer [${bridgeUtils.getInitialOperationHash(bridgeTokenTransfer)}]:

${bridgeUtils.stringifyBridgeTokenTransfer(bridgeTokenTransfer, 2)}

`
    : getNullOrUndefinedBridgeTokenTransferLogMessage(bridgeTokenTransfer);
};

export const getDipDupGraphQLErrorsLogMessage = (errors: ReadonlyArray<Record<'message', string>> | undefined | null): string => {
  return errors
    ? errors.reduce((result, error, index) => `${result}\n  ${index + 1}. ${error.message};`, 'DipDup GraphQL Errors:')
    : '[no errors]';
};
