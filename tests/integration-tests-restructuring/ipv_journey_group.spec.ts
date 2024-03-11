import { faker } from '@faker-js/faker';
import {
  preparePublishAndValidate,
  preparePublishAndValidateError,
  publishAndValidate,
  setEventData,
  setExtensions,
} from '../helpers/event-data-helper';
import fs from 'fs';

// todo this passes but takes over 100 seconds. do we need to rethink this/can we remove firehose buffering in test?
describe('IPV_JOURNEY GROUP Test - valid TXMA Event to SQS and expect event id stored in S3', () => {
  test.concurrent.each`
    eventName                           | event_id               | client_id              | journey_id
    ${'IPV_IDENTITY_REUSE_RESET'}       | ${faker.string.uuid()} | ${faker.string.uuid()} | ${faker.string.uuid()}
    ${'IPV_JOURNEY_END'}                | ${faker.string.uuid()} | ${faker.string.uuid()} | ${faker.string.uuid()}
    ${'IPV_JOURNEY_START'}              | ${faker.string.uuid()} | ${faker.string.uuid()} | ${faker.string.uuid()}

    `(
    'Should validate $eventName event content stored on S3',
    async ({ ...data }) => {
      // given
      const filePath = 'tests/fixtures/txma-event-ipv-journey-group.json';
      await preparePublishAndValidate(data, filePath);
    },
    240000,
  );
});
describe('IPV_JOURNEY GROUP Test - valid TXMA F2F Event to SQS and expect event id stored in S3', () => {
  test.concurrent.each`
    eventName                           | event_id               | client_id              | journey_id
    ${'IPV_SPOT_RESPONSE_APPROVED'}     | ${faker.string.uuid()} | ${faker.string.uuid()} | ${faker.string.uuid()}
    ${'IPV_SPOT_RESPONSE_REJECTED'}     | ${faker.string.uuid()} | ${faker.string.uuid()} | ${faker.string.uuid()}
    ${'IPV_IDENTITY_REUSE_COMPLETE'}    | ${faker.string.uuid()} | ${faker.string.uuid()} | ${faker.string.uuid()}
    `(
    'Should validate $eventName event content stored on S3',
    async ({ ...data }) => {
      // given
      const filePath = 'tests/fixtures/txma-event-ipv-journey-group.json';
      await preparePublishAndValidate(data, filePath);
    },
    240000,
  );
});

describe('IPV_JOURNEY GROUP Test - Invalid TXMA Event to SQS and expect event is not stored in S3', () => {
  test.concurrent.each`
    eventName                                      | event_id               | client_id              | journey_id
    ${'IPV_SPOT_RESPONSE_APPROVED'}     | ${faker.string.uuid()} | ${faker.string.uuid()} | ${faker.string.uuid()}
    ${'IPV_SPOT_RESPONSE_REJECTED'}     | ${faker.string.uuid()} | ${faker.string.uuid()} | ${faker.string.uuid()}
    ${'IPV_IDENTITY_REUSE_COMPLETE'}    | ${faker.string.uuid()} | ${faker.string.uuid()} | ${faker.string.uuid()}
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
  describe('IPV_IDENTITY_ISSUED GROUP Test - valid TXMA Event with extension to SQS and expect event id stored in S3', () => {
    test.concurrent.each`
    eventName                            | event_id          | extensions          
    ${'IPV_IDENTITY_ISSUED'}| ${faker.string.uuid()}  |     ${'ciFail,hasMitigations'}         
    ${'IPV_IDENTITY_ISSUED'}| ${faker.string.uuid()}  |     ${'levelOfConfidence'}         
    ${'IPV_IDENTITY_ISSUED'}| ${faker.string.uuid()}  |     ${'ciFail,levelOfConfidence'}         
    `(
      'Should validate $eventName event content stored on S3 with extension as $extensions',
      async ({ ...data }) => {
        // given
        const filePath = 'tests/fixtures/txma-event-group_with_empty_extensions.json';
        const event = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        setEventData(event, data);
        event.extensions.levelOfConfidence = 'P0';
        setExtensions(data.extensions, event);
        await publishAndValidate(event);
      },
      240000,
    );
  });
});
