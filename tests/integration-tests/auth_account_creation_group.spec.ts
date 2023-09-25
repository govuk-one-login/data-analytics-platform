import { faker } from '@faker-js/faker';
import { preparePublishAndValidate, preparePublishAndValidateError } from '../helpers/event-data-helper';

// todo this passes but takes over 100 seconds. do we need to rethink this/can we remove firehose buffering in test?

// describe('AUTH_ACCOUNT_CREATION GROUP Test - valid TXMA Event to SQS and expect event id stored in S3', () => {
//   test.concurrent.each`
//     eventName                                      | event_id               | client_id              | journey_id
//     ${'AUTH_CHECK_USER_NO_ACCOUNT_WITH_EMAIL'}     | ${faker.string.uuid()} | ${faker.string.uuid()} | ${faker.string.uuid()}
//     ${'AUTH_CREATE_ACCOUNT'}                       | ${faker.string.uuid()} | ${faker.string.uuid()} | ${faker.string.uuid()}
//      `(
//     'Should validate $eventName event content stored on S3',
//     async ({ ...data }) => {
//       // given
//       const filePath = 'tests/fixtures/txma-event-auth-account-creation-group.json';
//       await preparePublishAndValidate(data, filePath);
//     },
//     240000,
//   );
// });

describe('AUTH_ACCOUNT_CREATION GROUP Test - Invalid TXMA Event to SQS and expect event is not stored in S3', () => {
  test.concurrent.each`
    eventName                                      | event_id               | client_id              | journey_id
    ${'AUTH_CHECK_USER_NO_ACCOUNT_WITH_EMAIL'}     | ${faker.string.uuid()} | ${faker.string.uuid()} | ${faker.string.uuid()}
    ${'AUTH_CREATE_ACCOUNT'}                       | ${faker.string.uuid()} | ${faker.string.uuid()} | ${faker.string.uuid()}
      `(
    'Should validate $eventName event content not stored on S3',
    async ({ ...data }) => {
      // given
      const errorCode = 'DynamicPartitioning.MetadataExtractionFailed';
      const filePath = 'tests/fixtures/txma-event-invalid.json';
      await preparePublishAndValidateError(data, filePath, errorCode);
    },
    440000,
  );
});
