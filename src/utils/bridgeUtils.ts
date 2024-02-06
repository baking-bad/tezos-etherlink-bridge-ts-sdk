import { BridgeTokenTransferKind, type BridgeTokenTransfer, } from '../bridge';

export const getInitialOperationHash = (tokenTransfer: BridgeTokenTransfer): string => {
  return tokenTransfer.kind === BridgeTokenTransferKind.Deposit
    ? tokenTransfer.tezosOperation.hash
    : tokenTransfer.etherlinkOperation.hash;
};
