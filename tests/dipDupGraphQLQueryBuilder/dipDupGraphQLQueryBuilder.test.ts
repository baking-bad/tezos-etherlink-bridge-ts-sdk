import {
  getTokenTransferQueryByTestCases,
  getTokenTransfersQueryTestCases,
  getTokenTransfersQueryByAccountAddressesTestCases,
  getTokenTransferSubscriptionTestCases,
  getTokenTransfersSubscriptionsByAccountAddressesTestCases,
  getTokenTransfersSubscriptionsTestCases
} from './testCases';
import { prepareQueryFormatting } from './testHelper';
import { DipDupGraphQLQueryBuilder } from '../../src/bridgeDataProviders/dipDupBridgeDataProvider';

describe('DipDup GraphQL Query Builder', () => {
  let queryBuilder: DipDupGraphQLQueryBuilder;

  beforeEach(() => {
    queryBuilder = new DipDupGraphQLQueryBuilder();
  });

  test.each(getTokenTransferQueryByTestCases)(
    'Build the getTokenTransfer query %s',
    (_, testData) => {
      const query = queryBuilder.getTokenTransferQuery(testData.operationHash);
      const preparedQuery = prepareQueryFormatting(query);

      expect(preparedQuery).toBe(testData.expectedQuery);
    }
  );

  test.each(getTokenTransfersQueryTestCases)(
    'Build the getTokenTransfers query %s',
    (_, testData) => {
      const query = queryBuilder.getTokenTransfersQuery(null, 0, 100);
      const preparedQuery = prepareQueryFormatting(query);

      expect(preparedQuery).toBe(testData.expectedQuery);
    }
  );

  test.each(getTokenTransfersQueryByAccountAddressesTestCases)(
    'Build the getTokenTransfers query %s',
    (_, testData) => {
      const query = queryBuilder.getTokenTransfersQuery(testData.address, 0, 100);
      const preparedQuery = prepareQueryFormatting(query);

      expect(preparedQuery).toBe(testData.expectedQuery);
    }
  );

  test.each(getTokenTransferSubscriptionTestCases)(
    'Build the getTokenTransferSubscription query %s',
    (_, testData) => {
      const subscription = queryBuilder.getTokenTransferSubscription(testData.operationHash);
      const preparedSubscription = prepareQueryFormatting(subscription);

      expect(preparedSubscription).toBe(testData.expectedQuery);
    }
  );

  test.each(getTokenTransfersSubscriptionsByAccountAddressesTestCases)(
    'Build the getTokenTransferSubscriptions query %s',
    (_, testData) => {
      const queries = queryBuilder.getTokenTransfersSubscriptions(testData.address);

      expect(queries).toHaveLength(testData.expectedQueries.length);
      for (let i = 0; i < queries.length; i++) {
        const query = queries[i]!;
        const preparedQuery = prepareQueryFormatting(query);
        expect(preparedQuery).toBe(testData.expectedQueries[i]);
      }
    }
  );

  test.each(getTokenTransfersSubscriptionsTestCases)(
    'Build the getTokenTransferSubscriptions query %s',
    (_, testData) => {
      const queries = queryBuilder.getTokenTransfersSubscriptions(null);

      expect(queries).toHaveLength(testData.expectedQueries.length);
      for (let i = 0; i < queries.length; i++) {
        const query = queries[i]!;
        const preparedQuery = prepareQueryFormatting(query);
        expect(preparedQuery).toBe(testData.expectedQueries[i]);
      }
    }
  );
});

