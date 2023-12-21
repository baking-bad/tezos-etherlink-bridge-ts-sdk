import { InMemorySigner } from '@taquito/signer';
import { TezosToolkit } from '@taquito/taquito';

export const createTezosToolkitWithSigner = (signerKey: string, rpcUrl: string): TezosToolkit => {
  const toolkit = new TezosToolkit(rpcUrl);

  toolkit.setProvider({
    signer: new InMemorySigner(signerKey),
  });

  return toolkit;
};
