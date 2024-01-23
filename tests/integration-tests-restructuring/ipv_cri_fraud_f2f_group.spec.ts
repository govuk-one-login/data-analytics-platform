import { faker } from '@faker-js/faker';
import { preparePublishAndValidateError, publishAndValidate, setEventData } from '../helpers/event-data-helper';
import * as fs from 'fs';

// todo this passes but takes over 100 seconds. do we need to rethink this/can we remove firehose buffering in test?
describe('IPV_CRI_FRAUD GROUP Test - valid TXMA F2F Event without extension to SQS and expect event id stored in S3', () => {
  test.concurrent.each`
    eventName                            | event_id               | client_id              | journey_id
    ${'IPV_FRAUD_CRI_REQUEST_SENT'}             | ${faker.string.uuid()} | ${faker.string.uuid()} | ${faker.string.uuid()}
    ${'IPV_FRAUD_CRI_RESPONSE_RECEIVED'}             | ${faker.string.uuid()} | ${faker.string.uuid()} | ${faker.string.uuid()}
    ${'IPV_FRAUD_CRI_THIRD_PARTY_REQUEST_ENDED'}             | ${faker.string.uuid()} | ${faker.string.uuid()} | ${faker.string.uuid()}
    `(
    'Should validate $eventName event content stored on S3',
    async ({ ...data }) => {
      // given
      const filePath = 'tests/fixtures/txma-event-group_with_user_empty_extensions.json';
      const event = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      setEventData(event, data);
      // console.log(JSON.stringify(event));
      // when
      await publishAndValidate(event);
    },
    240000,
  );
});
describe('IPV_CRI_FRAUD GROUP Test - valid TXMA Event to SQS and expect event id not stored in S3', () => {
  test.concurrent.each`
    eventName                        | event_id               | client_id              | journey_id
    ${'IPV_FRAUD_CRI_REQUEST_SENT'}         | ${faker.string.uuid()} | ${faker.string.uuid()} | ${faker.string.uuid()}
    ${'IPV_FRAUD_CRI_REQUEST_SENT'}     | ${faker.string.uuid()} | ${faker.string.uuid()} | ${faker.string.uuid()}
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
