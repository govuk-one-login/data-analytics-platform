import { faker } from '@faker-js/faker';
import { preparePublishAndValidate } from '../helpers/event-data-helper';

// todo this passes but takes over 100 seconds. do we need to rethink this/can we remove firehose buffering in test?
describe('Happy path tests Publish valid TXMA Event to SQS and expect event id stored in S3', () => {
  test.concurrent.each`
    eventName                    | event_id               | client_id              | journey_id
    ${'AUTH_CHECK_USER_NO_ACCOUNT_WITH_EMAIL'} | ${faker.string.uuid()} | ${faker.string.uuid()} | ${faker.string.uuid()}
    ${'AUTH_CHECK_USER_KNOWN_EMAIL'}     | ${faker.string.uuid()} | ${faker.string.uuid()} | ${faker.string.uuid()}
    `(
    'Should validate $eventName event content stored on S3',
    async ({ ...data }) => {
      // given
      const filePath = 'tests/fixtures/txma-event.json';
      await preparePublishAndValidate(data, filePath);
    },
    240000,
  );
});

describe('AUTH_ACCOUNT_CREATION GROUP Test - Invalid TXMA Event to SQS and expect event is not stored in S3', () => {
  test.concurrent.each`
    eventName                                      | event_id               | client_id              | journey_id
    ${'DCMAW_PASSPORT_SELECTED'} | ${faker.string.uuid()} | ${faker.string.uuid()} | ${faker.string.uuid()}
    ${'IPV_FRAUD_CRI_START'}     | ${faker.string.uuid()} | ${faker.string.uuid()} | ${faker.string.uuid()}
    `(
    'Should validate $eventName event content not stored on S3',
    async ({ ...data }) => {
      // given
      const errorCode = 'DynamicPartitioning.MetadataExtractionFailed';
      const filePath = 'tests/fixtures/txma-event-invalid.json';
      await preparePublishAndValidateError(data, filePath, errorCode);
    },
    240000,
  );
});
