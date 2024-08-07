import {
  getTokenTransferQueryTestCases,
  getOperationTokenTransfersQueryTestCases,
  getTokenTransfersQueryTestCases,
  getTokenTransfersQueryByAccountAddressesTestCases,
  getTokenTransferSubscriptionTestCases,
  getOperationTokenTransfersSubscriptionTestCases,
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

  test.each(getTokenTransferQueryTestCases)(
    'Build the getTokenTransfer query %s',
    (_, testData) => {
      const query = queryBuilder.getTokenTransferQuery(testData.operationHash, testData.counter || testData.logIndex, testData.nonce);
      const preparedQuery = prepareQueryFormatting(query);

      expect(preparedQuery).toBe(testData.expectedQuery);
    }
  );

  test.each(getOperationTokenTransfersQueryTestCases)(
    'Build the getOperationTokenTransfers query %s',
    (_, testData) => {
      const query = queryBuilder.getOperationTokenTransfersQuery(testData.operationHash);
      const preparedQuery = prepareQueryFormatting(query);

      expect(preparedQuery).toBe(testData.expectedQuery);
    }
  );

  test.each(getTokenTransfersQueryTestCases)(
    'Build the getTokenTransfers query %s',
    (_, testData) => {
      const query = queryBuilder.getTokenTransfersQuery(null, testData.offset, testData.limit, testData.filter);
      const preparedQuery = prepareQueryFormatting(query);

      expect(preparedQuery).toBe(testData.expectedQuery);
    }
  );

  test.each(getTokenTransfersQueryByAccountAddressesTestCases)(
    'Build the getTokenTransfers query %s',
    (_, testData) => {
      const query = queryBuilder.getTokenTransfersQuery(testData.address, testData.offset, testData.limit, testData.filter);
      const preparedQuery = prepareQueryFormatting(query);

      expect(preparedQuery).toBe(testData.expectedQuery);
    }
  );

  test.each(getTokenTransferSubscriptionTestCases)(
    'Build the getOperationTokenTransferSubscription query %s',
    (_, testData) => {
      const subscription = queryBuilder.getTokenTransferSubscription(testData.operationHash, testData.counter || testData.logIndex, testData.nonce);
      const preparedSubscription = prepareQueryFormatting(subscription);

      expect(preparedSubscription).toBe(testData.expectedQuery);
    }
  );

  test.each(getOperationTokenTransfersSubscriptionTestCases)(
    'Build the getOperationTokenTransfersSubscription query %s',
    (_, testData) => {
      const subscription = queryBuilder.getTokenTransferSubscription(testData.operationHash);
      const preparedSubscription = prepareQueryFormatting(subscription);

      expect(preparedSubscription).toBe(testData.expectedQuery);
    }
  );

  test.each(getTokenTransfersSubscriptionsByAccountAddressesTestCases)(
    'Build the getTokenTransfersSubscription query %s',
    (_, testData) => {
      const subscription = queryBuilder.getTokenTransfersStreamSubscription(testData.address, testData.startUpdatedAt);
      const preparedSubscription = prepareQueryFormatting(subscription);

      expect(preparedSubscription).toBe(testData.expectedQuery);
    }
  );

  test.each(getTokenTransfersSubscriptionsTestCases)(
    'Build the getTokenTransfersSubscription query %s',
    (_, testData) => {
      const subscription = queryBuilder.getTokenTransfersStreamSubscription(null, testData.startUpdatedAt);
      const preparedSubscription = prepareQueryFormatting(subscription);

      expect(preparedSubscription).toBe(testData.expectedQuery);
    }
  );
});

