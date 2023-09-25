import { faker } from '@faker-js/faker';
import { preparePublishAndValidate, setEventData } from '../helpers/event-data-helper';
import fs from 'fs';
import { publishToTxmaQueue } from '../helpers/lambda-helpers';
import { getErrorFilePrefix } from '../helpers/common-helpers';
import { checkFileCreatedOnS3kinesis } from '../helpers/s3-helpers';

// todo this passes but takes over 100 seconds. do we need to rethink this/can we remove firehose buffering in test?
describe('IPV_CRI_PASSPORT GROUP Test - valid TXMA Event to SQS and expect event id stored in S3', () => {
  test.concurrent.each`
    eventName                           | event_id               | client_id              | journey_id
    ${'IPV_PASSPORT_CRI_START'}         | ${faker.string.uuid()} | ${faker.string.uuid()} | ${faker.string.uuid()}
    ${'IPV_PASSPORT_CRI_VC_ISSUED'}     | ${faker.string.uuid()} | ${faker.string.uuid()} | ${faker.string.uuid()}
    `(
    'Should validate $eventName event content stored on S3',
    async ({ ...data }) => {
      // given
      const filePath = 'tests/fixtures/txma-event-ipv-cri-passport-group.json';
      await preparePublishAndValidate(data, filePath);
    },
    240000,
  );
});

describe('IPV_CRI_PASSPORT GROUP Test - valid TXMA Event to SQS and expect event id not stored in S3', () => {
  test.concurrent.each`
    eventName                           | event_id               | client_id              | journey_id
    ${'IPV_PASSPORT_CRI_START'}         | ${faker.string.uuid()} | ${faker.string.uuid()} | ${faker.string.uuid()}
    ${'IPV_PASSPORT_CRI_VC_ISSUED'}     | ${faker.string.uuid()} | ${faker.string.uuid()} | ${faker.string.uuid()}
    `(
    'Should validate $eventName event content not stored on S3',
    async ({ ...data }) => {
      // given
      const errorCode = 'DynamicPartitioning.MetadataExtractionFailed';
      const filePath = 'tests/fixtures/txma-event-invalid.json';
      const event = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      setEventData(event, data);
      const publishResult = await publishToTxmaQueue(event);
      // then
      expect(publishResult).not.toBeNull();
      // given
      const prefix = getErrorFilePrefix();
      // then
      const fileUploaded = await checkFileCreatedOnS3kinesis(prefix, errorCode, 340000);
      expect(fileUploaded).toEqual(true);
    },
    440000,
  );
});
