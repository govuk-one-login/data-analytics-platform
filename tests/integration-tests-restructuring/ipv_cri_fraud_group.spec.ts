import { faker } from '@faker-js/faker';
import { preparePublishAndValidate, preparePublishAndValidateError } from '../helpers/event-data-helper';

// todo this passes but takes over 100 seconds. do we need to rethink this/can we remove firehose buffering in test?
describe('IPV_CRI_FRAUD GROUP Test - valid TXMA Event to SQS and expect event id stored in S3', () => {
  test.concurrent.each`
    eventName                        | event_id               | client_id              | journey_id
    ${'IPV_FRAUD_CRI_VC_ISSUED'}     | ${faker.string.uuid()} | ${faker.string.uuid()} | ${faker.string.uuid()}
    ${'IPV_FRAUD_CRI_REQUEST_SENT'}             | ${faker.string.uuid()} | ${faker.string.uuid()} | ${faker.string.uuid()}
    ${'IPV_FRAUD_CRI_RESPONSE_RECEIVED'}             | ${faker.string.uuid()} | ${faker.string.uuid()} | ${faker.string.uuid()}
    ${'IPV_FRAUD_CRI_THIRD_PARTY_REQUEST_ENDED'}             | ${faker.string.uuid()} | ${faker.string.uuid()} | ${faker.string.uuid()}
    `(
    'Should validate $eventName event content stored on S3',
    async ({ ...data }) => {
      // given
      const filePath = 'tests/fixtures/txma-event-ipv-cri-fraud-group.json';
      await preparePublishAndValidate(data, filePath);
    },
    240000,
  );
});

describe('IPV_CRI_FRAUD GROUP Test - valid TXMA Event to SQS and expect event id not stored in S3', () => {
  test.concurrent.each`
    eventName                        | event_id               | client_id              | journey_id
    ${'IPV_FRAUD_CRI_START'}         | ${faker.string.uuid()} | ${faker.string.uuid()} | ${faker.string.uuid()}
    ${'IPV_FRAUD_CRI_VC_ISSUED'}     | ${faker.string.uuid()} | ${faker.string.uuid()} | ${faker.string.uuid()}
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
