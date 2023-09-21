import { faker } from '@faker-js/faker';
import { preparePublishAndValidate, preparePublishAndValidateError } from '../helpers/event-data-helper';

// this passes but takes over 100 seconds. do we need to rethink this/can we remove firehose buffering in test?
describe('AUTH_ACCOUNT_USER_LOGIN GROUP Test - valid TXMA Event to SQS and expect event id stored in S3', () => {
  test.concurrent.each`
    eventName                            | event_id               | client_id              | journey_id
    ${'AUTH_CHECK_USER_KNOWN_EMAIL'}     | ${faker.string.uuid()} | ${faker.string.uuid()} | ${faker.string.uuid()}
    ${'AUTH_LOG_IN_SUCCESS'}             | ${faker.string.uuid()} | ${faker.string.uuid()} | ${faker.string.uuid()}
    `(
    'Should validate $eventName event content stored on S3',
    async ({ ...data }) => {
      // given
      const filePath = 'tests/fixtures/txma-event-auth-account-user-login-group.json';
      await preparePublishAndValidate(data, filePath);
    },
    240000,
  );
});
describe('AUTH_ACCOUNT_USER_LOGIN GROUP Test - in valid TXMA Event to SQS and expect event id not stored in S3', () => {
  test.concurrent.each`
    eventName                            | event_id               | client_id              | journey_id
    ${'AUTH_CHECK_USER_KNOWN_EMAIL'}     | ${faker.string.uuid()} | ${faker.string.uuid()} | ${faker.string.uuid()}
    ${'AUTH_LOG_IN_SUCCESS'}             | ${faker.string.uuid()} | ${faker.string.uuid()} | ${faker.string.uuid()}
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
