import { faker } from '@faker-js/faker';
import { setPublishAndValidate, setPublishAndValidateError } from '../helpers/common-helpers';

// todo this passes but takes over 100 seconds. do we need to rethink this/can we remove firehose buffering in test?
describe('DCMAW_CRI GROUP Test - valid TXMA Event to SQS and expect event id stored in S3', () => {
  test.concurrent.each`
    eventName                           | event_id               | client_id              | journey_id
    ${'DCMAW_APP_END'}                  | ${faker.string.uuid()} | ${faker.string.uuid()} | ${faker.string.uuid()}
    ${'DCMAW_APP_HANDOFF_START'}        | ${faker.string.uuid()} | ${faker.string.uuid()} | ${faker.string.uuid()}
    ${'DCMAW_APP_START'}                | ${faker.string.uuid()} | ${faker.string.uuid()} | ${faker.string.uuid()}
    ${'DCMAW_BRP_SELECTED'}             | ${faker.string.uuid()} | ${faker.string.uuid()} | ${faker.string.uuid()}
    ${'DCMAW_CRI_START'}                | ${faker.string.uuid()} | ${faker.string.uuid()} | ${faker.string.uuid()}
    ${'DCMAW_CRI_VC_ISSUED'}            | ${faker.string.uuid()} | ${faker.string.uuid()} | ${faker.string.uuid()}
    ${'DCMAW_DRIVING_LICENCE_SELECTED'} | ${faker.string.uuid()} | ${faker.string.uuid()} | ${faker.string.uuid()}
    ${'DCMAW_PASSPORT_SELECTED'}        | ${faker.string.uuid()} | ${faker.string.uuid()} | ${faker.string.uuid()}
    ${'DCMAW_WEB_END'}                  | ${faker.string.uuid()} | ${faker.string.uuid()} | ${faker.string.uuid()}
    `(
    'Should validate $eventName event content stored on S3',
    async ({ ...data }) => {
      const filePath = 'tests/fixtures/txma-event-dcmaw-cri-group.json';
      await setPublishAndValidate(data, filePath);
    },
    240000,
  );
});

describe('DCMAW_CRI GROUP Test - valid TXMA Event to SQS and expect event id not stored in S3', () => {
  test.concurrent.each`
    eventName                           | event_id               | client_id              | journey_id
    ${'DCMAW_APP_END'}                  | ${faker.string.uuid()} | ${faker.string.uuid()} | ${faker.string.uuid()}
    ${'DCMAW_APP_HANDOFF_START'}        | ${faker.string.uuid()} | ${faker.string.uuid()} | ${faker.string.uuid()}
    ${'DCMAW_APP_START'}                | ${faker.string.uuid()} | ${faker.string.uuid()} | ${faker.string.uuid()}
    ${'DCMAW_BRP_SELECTED'}             | ${faker.string.uuid()} | ${faker.string.uuid()} | ${faker.string.uuid()}
    ${'DCMAW_CRI_START'}                | ${faker.string.uuid()} | ${faker.string.uuid()} | ${faker.string.uuid()}
    ${'DCMAW_CRI_VC_ISSUED'}            | ${faker.string.uuid()} | ${faker.string.uuid()} | ${faker.string.uuid()}
    ${'DCMAW_DRIVING_LICENCE_SELECTED'} | ${faker.string.uuid()} | ${faker.string.uuid()} | ${faker.string.uuid()}
    ${'DCMAW_PASSPORT_SELECTED'}        | ${faker.string.uuid()} | ${faker.string.uuid()} | ${faker.string.uuid()}
    ${'DCMAW_WEB_END'}                  | ${faker.string.uuid()} | ${faker.string.uuid()} | ${faker.string.uuid()}
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
