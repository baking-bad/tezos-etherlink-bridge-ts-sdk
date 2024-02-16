import type { TokenBalanceDto } from './dtos';
import type { AccountTokenBalanceInfo, TokenBalanceInfo } from '../accountTokenBalanceInfo';

export const mapTokenBalanceDtoToTokenBalanceInfo = (dto: TokenBalanceDto): TokenBalanceInfo | null => {
  if (!dto.account?.address || !dto.token || !dto.token.contract?.address || (dto.token.standard !== 'fa1.2' && dto.token.standard !== 'fa2'))
    return null;

  return {
    token: (dto.token.standard === 'fa2'
      ? {
        type: dto.token.standard,
        address: dto.token.contract.address,
        tokenId: dto.token.tokenId || '0'
      }
      : {
        type: dto.token.standard,
        address: dto.token.contract.address,
      }
    ),
    balance: dto.balance ? BigInt(dto.balance) : 0n
  };
};

export const mapTokenBalanceDtosToAccountTokenBalanceInfo = (dtos: readonly TokenBalanceDto[]): AccountTokenBalanceInfo | null => {
  const tokenBalanceInfos = [];
  let address: string | undefined;

  for (const dto of dtos) {
    const tokenBalanceInfo = mapTokenBalanceDtoToTokenBalanceInfo(dto);
    if (tokenBalanceInfo) {
      tokenBalanceInfos.push(tokenBalanceInfo);
      address = dto.account!.address!;
    }
  }

  return address && tokenBalanceInfos.length
    ? {
      address,
      tokenBalances: tokenBalanceInfos
    }
    : null;
};
