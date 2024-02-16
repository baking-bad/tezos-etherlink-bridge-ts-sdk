export type AliasDto = {
  alias?: string | null;
  address?: string | null;
};

export type TokenInfoDto = {
  id: number;
  contract?: AliasDto | null;
  tokenId?: string | null;
  standard?: string | null;
  totalSupply?: string | null;
  metadata?: any;
};

export type TokenBalanceDto = {
  id: number;
  account?: AliasDto | null;
  token?: TokenInfoDto | null;
  balance?: string | null;
  transfersCount: number;
  firstLevel: number;
  firstTime: string;
  lastLevel: number;
  lastTime: string;
};
