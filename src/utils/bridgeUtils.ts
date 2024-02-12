import { BridgeTokenTransferKind, type BridgeTokenTransfer, } from '../bridge';

export const getInitialOperation = (tokenTransfer: BridgeTokenTransfer) => {
  return tokenTransfer.kind === BridgeTokenTransferKind.Deposit
    ? tokenTransfer.tezosOperation
    : tokenTransfer.etherlinkOperation;
};

export const getInitialOperationHash = (tokenTransfer: BridgeTokenTransfer): string => {
  return tokenTransfer.kind === BridgeTokenTransferKind.Deposit
    ? tokenTransfer.tezosOperation.hash
    : tokenTransfer.etherlinkOperation.hash;
};

export const isBridgeTokenTransferOwner = (tokenTransfer: BridgeTokenTransfer, address: string): boolean => {
  return tokenTransfer.source === address || tokenTransfer.receiver === address;
};
