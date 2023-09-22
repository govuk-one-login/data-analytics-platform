import { faker } from '@faker-js/faker';
import { preparePublishAndValidate, publishAndValidate, setEventData } from '../helpers/event-data-helper';
import * as fs from 'fs';
import { publishToTxmaQueue } from '../helpers/lambda-helpers';
import { getErrorFilePrefix } from '../helpers/common-helpers';
import { checkFileCreatedOnS3kinesis } from '../helpers/s3-helpers';

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
      const event = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      await publishAndValidate(event);
    },
    440000,
  );
});

describe('DCMAW_CRI GROUP Test - valid TXMA Event to SQS and expect event id not stored in S3', () => {
  test.concurrent.each`
    eventName                           | event_id               | client_id              | journey_id
    ${'DCMAW_APP_END'}                  | ${faker.string.uuid()} | ${faker.string.uuid()} | ${faker.string.uuid()}
    `(
    'Should validate $eventName event content not stored on S3',
    async ({ ...data }) => {
      // given
      const errorCode = 'DynamicPartitioning.MetadataExtractionFailed';
      const event = JSON.parse(fs.readFileSync('tests/fixtures/txma-event-invalid.json', 'utf-8'));
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
    340000,
  );
});
