import {
  getTokenTransferQueryByEtherlinkOperationTestCases,
  getTokenTransferQueryByTezosOperationTestCases,
  getTokenTransfersQueryByAccountAddressesTestCases
} from './testCases';
import { prepareQueryFormatting } from './testHelper';
import { DipDupGraphQLQueryBuilder } from '../../src/bridgeDataProviders/dipDupBridgeDataProvider';

describe('DipDup GraphQL Query Builder', () => {
  let queryBuilder: DipDupGraphQLQueryBuilder;

  beforeEach(() => {
    queryBuilder = new DipDupGraphQLQueryBuilder();
  });

  test.each(getTokenTransferQueryByTezosOperationTestCases.concat(getTokenTransferQueryByEtherlinkOperationTestCases))(
    'Build the getTokenTransfer query %s',
    (_, testData) => {
      const query = queryBuilder.getTokenTransferQuery(testData.operationHash);
      const preparedQuery = prepareQueryFormatting(query);

      expect(preparedQuery).toBe(testData.expectedQuery);
    }
  );

  test.each(getTokenTransfersQueryByAccountAddressesTestCases.slice(4))(
    'Build the getTokenTransfers query %s',
    (_, testData) => {
      const query = queryBuilder.getTokenTransfersQuery(testData.address, 0, 100);
      const preparedQuery = prepareQueryFormatting(query);

      expect(preparedQuery).toBe(testData.expectedQuery);
    }
  );

});
