import type { TokenBalanceDto } from './dtos';
import { getErrorLogMessage, loggerProvider } from '../../../logging';
import type { AccountTokenBalance, AccountTokenBalances, TokenBalanceInfo } from '../accountTokenBalances';

type ValidTokenBalanceDto = TokenBalanceDto & {
  account: {
    address: string;
  };
  token: {
    contract: {
      address: string;
    };
    standard: 'fa1.2' | 'fa2';
  }
};

const isTokenBalanceDtoValid = (dto: TokenBalanceDto | undefined | null): dto is ValidTokenBalanceDto => {
  return !!(dto && dto.account?.address && dto.token && dto.token.contract?.address && (dto.token.standard === 'fa1.2' || dto.token.standard === 'fa2'));
};

const mapTokenBalanceDtoToTokenBalanceInfo = (dto: ValidTokenBalanceDto): TokenBalanceInfo => {
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

export const mapTokenBalanceDtosToAccountTokenBalances = (dtos: readonly TokenBalanceDto[]): AccountTokenBalances | null => {
  try {
    const tokenBalanceInfos = [];
    let address: string | undefined;

    for (const dto of dtos) {
      if (!isTokenBalanceDtoValid(dto))
        continue;

      const tokenBalanceInfo = mapTokenBalanceDtoToTokenBalanceInfo(dto);
      tokenBalanceInfos.push(tokenBalanceInfo);
      address = dto.account!.address!;
    }

    return address && tokenBalanceInfos.length
      ? {
        address,
        tokenBalances: tokenBalanceInfos
      }
      : null;
  }
  catch (error) {
    loggerProvider.logger.error('Token Balances DTOs mapping error.', getErrorLogMessage(error));

    return null;
  }
};

export const mapTokenBalanceDtosToAccountTokenBalance = (dtos: readonly TokenBalanceDto[]): AccountTokenBalance | null => {
  try {
    if (!isTokenBalanceDtoValid(dtos[0]))
      return null;

    const accountTokenBalance = mapTokenBalanceDtoToTokenBalanceInfo(dtos[0]) as AccountTokenBalance;
    (accountTokenBalance as any).address = dtos[0].account.address;

    return accountTokenBalance;
  } catch (error) {
    loggerProvider.logger.error('Token Balance DTOs mapping error.', getErrorLogMessage(error));

    return null;
  }
};
