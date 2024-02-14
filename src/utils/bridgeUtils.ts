import { BridgeTokenTransferKind, type BridgeTokenTransfer, type FinishedBridgeTokenDeposit } from '../bridgeCore';

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

const operationFieldNames: ReadonlyArray<keyof FinishedBridgeTokenDeposit> = ['tezosOperation', 'etherlinkOperation'];
const bigIntFieldNames: ReadonlyArray<keyof FinishedBridgeTokenDeposit['etherlinkOperation' | 'tezosOperation']> = ['amount', 'fee'];
const jsonStringifyReplacer = (_key: string, value: unknown) => typeof value === 'bigint'
  ? value.toString(10)
  : value;
export const stringifyBridgeTokenTransfer = (tokenTransfer: BridgeTokenTransfer, space?: string | number | undefined): string => {
  try {
    return JSON.stringify(tokenTransfer, jsonStringifyReplacer, space);
  }
  catch (error) {
    return '';
  }
};

export const parseBridgeTokenTransfer = (tokenTransfer: string): string | null => {
  try {
    const transfer = JSON.parse(tokenTransfer);

    for (const operationName of operationFieldNames) {
      if (transfer[operationName]) {
        for (const bigIntFieldName of bigIntFieldNames) {
          if (transfer[operationName][bigIntFieldName]) {
            transfer[operationName][bigIntFieldName] = BigInt(transfer[operationName][bigIntFieldName]);
          }
        }
      }
    }

    return transfer;
  }
  catch (error) {
    return null;
  }
};
