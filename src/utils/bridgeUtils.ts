import { BridgeTokenTransferKind, type BridgeTokenTransfer, type FinishedBridgeTokenDeposit, BridgeTokenTransferStatus } from '../bridgeCore';

const tokenTransferIdSeparator = '_';
const isEtherlinkTransaction = (operationHash: string) => operationHash.startsWith('0x');

export const getInitialOperation = (tokenTransfer: BridgeTokenTransfer) => tokenTransfer.kind === BridgeTokenTransferKind.Deposit
  ? tokenTransfer.tezosOperation
  : tokenTransfer.etherlinkOperation;

export const getTokenTransferIdOrInitialOperationHash = (tokenTransfer: BridgeTokenTransfer) => tokenTransfer.status === BridgeTokenTransferStatus.Pending
  ? getInitialOperation(tokenTransfer).hash
  : tokenTransfer.id;

export function convertOperationDataToTokenTransferId(etherlinkOperationHash: string, logIndex: number): string;
export function convertOperationDataToTokenTransferId(tezosOperationHash: string, counter: number, nonce: number | null): string;
export function convertOperationDataToTokenTransferId(operationHash: string, logIndexOrCounter: number, nonce?: number | null): string;
export function convertOperationDataToTokenTransferId(operationHash: string, logIndexOrCounter: number, nonce?: number | null): string {
  return !isEtherlinkTransaction(operationHash) && typeof nonce === 'number'
    ? `${operationHash}${tokenTransferIdSeparator}${logIndexOrCounter.toString(10)}${tokenTransferIdSeparator}${nonce.toString(10)}`
    : `${operationHash}${tokenTransferIdSeparator}${logIndexOrCounter.toString(10)}`;
}

export const convertTokenTransferIdToOperationData = (
  tokenTransferId: string
): null
  | readonly [tezosOperationHash: string, counter: number, nonce: number | null]
  | readonly [etherlinkOperationHash: string, logIndex: number] => {
  if (!tokenTransferId)
    return null;

  try {
    const operationData = tokenTransferId.split(tokenTransferIdSeparator);
    if (!operationData[0] || !operationData[1])
      return null;

    const counterOrLogIndex = Number.parseInt(operationData[1]);
    if (isEtherlinkTransaction(tokenTransferId))
      return [operationData[0], counterOrLogIndex];


    return operationData[2]
      ? [operationData[0], counterOrLogIndex, Number.parseInt(operationData[2])]
      : [operationData[0], counterOrLogIndex, null];
  }
  catch {
    //
  }

  return null;
};

export const isBridgeTokenTransferOwner = (tokenTransfer: BridgeTokenTransfer, address: string): boolean => {
  return tokenTransfer.source === address || tokenTransfer.receiver === address;
};

const operationFieldNames: ReadonlyArray<keyof FinishedBridgeTokenDeposit> = ['tezosOperation', 'etherlinkOperation'];
const bigIntFieldNames: ReadonlyArray<keyof FinishedBridgeTokenDeposit['etherlinkOperation' | 'tezosOperation']> = ['amount'];
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

export const parseBridgeTokenTransfer = (tokenTransfer: string): BridgeTokenTransfer | null => {
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
