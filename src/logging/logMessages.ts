import {
  BridgeTokenTransferKind, BridgeTokenTransferStatus,
  type BridgeTokenTransfer, type FinishedBridgeTokenDeposit
} from '../bridgeCore';
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

export const getBridgeTokenTransferIdLogMessage = (bridgeTokenTransfer: BridgeTokenTransfer | null | undefined): string => {
  return bridgeTokenTransfer
    ? bridgeTokenTransfer.status !== BridgeTokenTransferStatus.Pending
      ? bridgeTokenTransfer.id
      : `none (${bridgeUtils.getInitialOperation(bridgeTokenTransfer).hash})`
    : bridgeTokenTransfer === null
      ? 'null'
      : 'undefined';
};

const getNullOrUndefinedBridgeTokenTransferLogMessage = (bridgeTokenTransfer: null | undefined): string => {
  return `Bridge Token transfer is ${bridgeTokenTransfer === null ? 'null' : 'undefined'}`;
};

export const getBridgeTokenTransferLogMessage = (bridgeTokenTransfer: BridgeTokenTransfer | null | undefined): string => {
  return bridgeTokenTransfer
    ? `Bridge Token Transfer:
  Id: ${bridgeTokenTransfer && bridgeTokenTransfer.status !== BridgeTokenTransferStatus.Pending ? bridgeTokenTransfer.id : 'none'}
  Kind: ${BridgeTokenTransferKind[bridgeTokenTransfer.kind]}
  Status: ${BridgeTokenTransferStatus[bridgeTokenTransfer.status]}
  Source: ${bridgeTokenTransfer.source}
  Receiver: ${bridgeTokenTransfer.receiver}
  Tezos operation hash: ${(bridgeTokenTransfer as FinishedBridgeTokenDeposit)?.tezosOperation?.hash}
  Etherlink operation hash: ${(bridgeTokenTransfer as FinishedBridgeTokenDeposit)?.etherlinkOperation?.hash}

`
    : getNullOrUndefinedBridgeTokenTransferLogMessage(bridgeTokenTransfer);
};

export const getDetailedBridgeTokenTransferLogMessage = (bridgeTokenTransfer: BridgeTokenTransfer | null | undefined): string => {
  return bridgeTokenTransfer
    ? `Bridge Token Transfer [${getBridgeTokenTransferIdLogMessage(bridgeTokenTransfer)}]:

${bridgeUtils.stringifyBridgeTokenTransfer(bridgeTokenTransfer, 2)}

`
    : getNullOrUndefinedBridgeTokenTransferLogMessage(bridgeTokenTransfer);
};

export const getDipDupGraphQLErrorsLogMessage = (errors: ReadonlyArray<Record<'message', string>> | undefined | null): string => {
  return errors
    ? errors.reduce((result, error, index) => `${result}\n  ${index + 1}. ${error.message};`, 'DipDup GraphQL Errors:')
    : '[no errors]';
};
