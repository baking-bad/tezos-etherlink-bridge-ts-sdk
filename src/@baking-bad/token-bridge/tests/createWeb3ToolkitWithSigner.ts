import Web3 from 'web3';

export const createWeb3ToolkitWithSigner = (signerKey: string, rpcUrl: string): Web3 => {
  const toolkit = new Web3(rpcUrl);
  const account = toolkit.eth.accounts.privateKeyToAccount('0x' + signerKey);
  toolkit.eth.accounts.wallet.add(account);
  toolkit.eth.defaultAccount = account.address;

  return toolkit;
};
