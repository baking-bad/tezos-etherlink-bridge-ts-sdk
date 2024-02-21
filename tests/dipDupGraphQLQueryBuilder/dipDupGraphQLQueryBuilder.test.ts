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
      const query = queryBuilder.getTokenTransfersQuery(null, testData.offset, testData.limit);
      const preparedQuery = prepareQueryFormatting(query);

      expect(preparedQuery).toBe(testData.expectedQuery);
    }
  );

  test.each(getTokenTransfersQueryByAccountAddressesTestCases)(
    'Build the getTokenTransfers query %s',
    (_, testData) => {
      const query = queryBuilder.getTokenTransfersQuery(testData.address, testData.offset, testData.limit);
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
      const subscription = queryBuilder.getTokenTransfersStreamSubscription(testData.address, testData.startUpdatedAt);
      const preparedSubscription = prepareQueryFormatting(subscription);

      expect(preparedSubscription).toBe(testData.expectedQuery);
    }
  );

  test.each(getTokenTransfersSubscriptionsTestCases)(
    'Build the getTokenTransferSubscriptions query %s',
    (_, testData) => {
      const subscription = queryBuilder.getTokenTransfersStreamSubscription(null, testData.startUpdatedAt);
      const preparedSubscription = prepareQueryFormatting(subscription);

      expect(preparedSubscription).toBe(testData.expectedQuery);
    }
  );
});

