import { packDataBytes, MichelsonType } from '@taquito/michel-codec';
import { Schema } from '@taquito/michelson-encoder';
import { TezosToolkit } from '@taquito/taquito';
import BigNumber from 'bignumber.js';

export const convertTezosAddressToBytes = (address: string): string => {
  return packDataBytes({ string: address }, { prim: 'address' }).bytes.slice(-44);
};

export const convertBigNumberToBigInt = (number: BigNumber): bigint => {
  const strValue = number.toString(10);
  return (strValue.startsWith('-'))
    ? -BigInt(strValue.substring(1))
    : BigInt(strValue);
};

export const convertTicketerContentToBytes = async (toolkit: TezosToolkit, ticketerAddress: string): Promise<string> => {
  const contract = await toolkit.contract.at(ticketerAddress);
  const storage = await contract.storage<{ content: unknown }>();

  const contentMichelsonType: MichelsonType = {
    prim: 'pair',
    annots: ['%content'],
    args: [
      { prim: 'nat' },
      {
        prim: 'option',
        args: [{ prim: 'bytes' }]
      }
    ]
  };
  const contentSchema = new Schema(contentMichelsonType);
  const contentMichelsonData = contentSchema.Encode(storage.content);

  return packDataBytes(contentMichelsonData, contentMichelsonType).bytes.slice(2);
};
