import { faker } from '@faker-js/faker';
import { setPublishAndValidate, setPublishAndValidateError } from '../helpers/common-helpers';

// todo this passes but takes over 100 seconds. do we need to rethink this/can we remove firehose buffering in test?
describe('AUTH_ACCOUNT_MFA GROUP Test - valid TXMA Event to SQS and expect event id stored in S3', () => {
  test.concurrent.each`
    eventName                    | event_id               | client_id              | journey_id
    ${'AUTH_CODE_VERIFIED'}     | ${faker.string.uuid()} | ${faker.string.uuid()} | ${faker.string.uuid()}
    `(
    'Should validate $eventName event content stored on S3',
    async ({ ...data }) => {
      // given
      const filePath = 'tests/fixtures/txma-event-auth-account-mfa-group.json';
      await setPublishAndValidate(data, filePath);
    },
    240000,
  );
});

describe('AUTH_ACCOUNT_MFA GROUP Test - valid TXMA Event to SQS and expect event id not stored in S3', () => {
  test.concurrent.each`
    eventName                    | event_id               | client_id              | journey_id
    ${'AUTH_CODE_VERIFIED'}     | ${faker.string.uuid()} | ${faker.string.uuid()} | ${faker.string.uuid()}
    `(
    'Should validate $eventName event content not stored on S3',
    async ({ ...data }) => {
      // given
      const errorCode = 'DynamicPartitioning.MetadataExtractionFailed';
      const filePath = 'tests/fixtures/txma-event-invalid.json';
      await setPublishAndValidateError(data, filePath, errorCode);
    },
    240000,
  );
});
