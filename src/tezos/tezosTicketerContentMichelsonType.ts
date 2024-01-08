import type { MichelsonType } from '@taquito/michel-codec';

export const tezosTicketerContentMichelsonType: MichelsonType = {
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
