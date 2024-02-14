import { BridgeTokenTransfer, BridgeTokenTransferKind, FinishedBridgeTokenDeposit } from '..';
import { EtherlinkToken } from '../etherlink';
import { TezosToken } from '../tezos';
import { bridgeUtils } from '../utils';

export const getErrorLogMessage = (error: any): string => {
  if (!error)
    return `[error is ${error === null ? 'null' : 'undefined'}]`;

  if (typeof error === 'string')
    return error;
  else if (typeof error?.message === 'string')
    return error.message;

  return '[unknown error type]';
};

export const getTokenLogMessage = (token: TezosToken | EtherlinkToken): string => {
  if (!token)
    return `[token is ${token === null ? 'null' : 'undefined'}]`;

  switch (token.type) {
    case 'native':
      return '[native token]';
    case 'erc20':
      return `[${token.address} | ERC-20]`;
    case 'fa1.2':
      return `[${token.address} | FA1.2]`;
    case 'fa2':
      return `[${token.address} | FA2 | Id: ${token.tokenId}]`;
    default:
      return '[unknown token type]';
  }
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
