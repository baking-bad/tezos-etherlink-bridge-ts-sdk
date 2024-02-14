import { BridgeTokenTransfer, BridgeTokenTransferKind, FinishedBridgeTokenDeposit } from '..';
import { EtherlinkToken } from '../etherlink';
import { TezosToken } from '../tezos';
import { bridgeUtils } from '../utils';

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

export const getBridgeTokenTransferLogMessage = (bridgeTokenTransfer: BridgeTokenTransfer): string => {
  return `Bridge Token Transfer:
  Kind: ${BridgeTokenTransferKind[bridgeTokenTransfer.kind]}
  Status: ${BridgeTokenTransferKind[bridgeTokenTransfer.status]}
  Source: ${bridgeTokenTransfer.source}
  Receiver: ${bridgeTokenTransfer.receiver}
  Tezos operation hash: ${(bridgeTokenTransfer as FinishedBridgeTokenDeposit)?.tezosOperation?.hash}
  Etherlink operation hash: ${(bridgeTokenTransfer as FinishedBridgeTokenDeposit)?.etherlinkOperation?.hash}

`;
};

export const getDetailedBridgeTokenTransferLogMessage = (bridgeTokenTransfer: BridgeTokenTransfer): string => {
  return `Bridge Token Transfer [${bridgeUtils.getInitialOperationHash(bridgeTokenTransfer)}]:

${bridgeUtils.stringifyBridgeTokenTransfer(bridgeTokenTransfer, 2)}

`;
};
