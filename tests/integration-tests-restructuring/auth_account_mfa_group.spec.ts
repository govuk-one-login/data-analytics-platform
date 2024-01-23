import { faker } from '@faker-js/faker';
import {
  preparePublishAndValidate,
  preparePublishAndValidateError,
  publishAndValidate,
  setEventData,
} from '../helpers/event-data-helper';
import fs from 'fs';

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
      await preparePublishAndValidate(data, filePath);
    },
    240000,
  );
});
describe('AUTH_ACCOUNT_MFA GROUP Test - valid TXMA Event with extension to SQS and expect event id stored in S3', () => {
  test.concurrent.each`
    eventName                            | event_id               | client_id               | extensions              | journey_id
    ${'AUTH_CODE_VERIFIED'}| ${faker.string.uuid()} | ${faker.string.uuid()}  |     ${'mfa-type'}                | ${faker.string.uuid()}
    ${'AUTH_CODE_VERIFIED'}| ${faker.string.uuid()} | ${faker.string.uuid()}  |      ${'notification-type'}        | ${faker.string.uuid()}
    ${'AUTH_CODE_VERIFIED'}| ${faker.string.uuid()} | ${faker.string.uuid()}  |      ${'account-recovery'}        | ${faker.string.uuid()}
    `(
    'Should validate $eventName event content stored on S3 with extention as $extensions',
    async ({ ...data }) => {
      // given
      const filePath = 'tests/fixtures/txma-event-group_with_empty_extensions.json';
      const event = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      setEventData(event, data);
      if (data.extensions === 'mfa-type') event.extensions['mfa-type'] = 'SMS';
      else if (data.extensions === 'notification-type')
        event.extensions['notification-type'] = 'RESET_PASSWORD_WITH_CODE';
      else event.extensions['account-recovery'] = 'email';
      // console.log('Event Data' + JSON.stringify(event));
      // when
      await publishAndValidate(event);
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
      await preparePublishAndValidateError(data, filePath, errorCode);
    },
    440000,
  );
});
