import * as fs from 'fs';
import { faker } from '@faker-js/faker';
import { getEventFilePrefix, getErrorFilePrefix } from '../helpers/common-helpers';
import { checkFileCreatedOnS3,checkFileCreatedOnS3kinesis } from '../helpers/s3-helpers';
import { publishToTxmaQueue } from '../helpers/lambda-helpers';



// todo this passes but takes over 100 seconds. do we need to rethink this/can we remove firehose buffering in test?
describe('AUTH_ORCHESTRATION GROUP Test - valid TXMA Event to SQS and expect event id stored in S3', () => {
  test.concurrent.each`
    eventName                    | event_id               | client_id              | journey_id
    ${'AUTH_AUTHORISATION_INITIATED'}     | ${faker.string.uuid()} | ${faker.string.uuid()} | ${faker.string.uuid()}
    `(
    'Should validate $eventName event content stored on S3',
    async ({ ...data }) => {
      // given
      const event = JSON.parse(fs.readFileSync('integration-test/fixtures/txma-event.json', 'utf-8'));
      event.event_id = data.event_id;
      event.client_id = data.client_id;
      event.user.govuk_signin_journey_id = data.journey_id;
      event.event_name = data.eventName;
      const pastDate = faker.date.past();
      event.timestamp = pastDate.getTime();
      event.timestamp_formatted = JSON.stringify(pastDate);

      // when
      const publishResult = await publishToTxmaQueue(event);
      // then
      expect(publishResult).not.toBeNull();
      expect(publishResult).toHaveProperty('MessageId');

      // given
      const prefix = getEventFilePrefix(event.event_name);

      // then
      const fileUploaded = await checkFileCreatedOnS3(prefix, event.event_id, 120000);
      expect(fileUploaded).toEqual(true);
    },
    240000,
  );
});

describe('AUTH_ORCHESTRATION GROUP Test - valid TXMA Event to SQS and expect event id not stored in S3', () => {
  test.concurrent.each`
    eventName                    | event_id               | client_id              | journey_id
    ${'AUTH_AUTHORISATION_INITIATED'}     | ${faker.string.uuid()} | ${faker.string.uuid()} | ${faker.string.uuid()}
    `(
    'Should validate $eventName event content not stored on S3',
    async ({ ...data }) => {
      console.log("start")
      // given
      const errorCode = "DynamicPartitioning.MetadataExtractionFailed";
      const event = JSON.parse(fs.readFileSync('integration-test/fixtures/txma-event-invalid.json', 'utf-8'));
      console.log(event)
      console.log(data)
      console.log(data.client_id)
      event.client_id = data.client_id;
      event.user.govuk_signin_journey_id = data.journey_id;
      event.event_name = data.eventName;
      const pastDate = faker.date.past();
      event.timestamp = Math.round(pastDate.getTime() / 1000);
      const publishResult1 = await publishToTxmaQueue(event);
      // then
      expect(publishResult1).not.toBeNull();
      // given
      const prefix = getErrorFilePrefix();
      console.log(prefix)
      // then
      const fileUploaded1 = await checkFileCreatedOnS3kinesis(prefix, errorCode, 120000);
      expect(fileUploaded1).toEqual(true);
    },
    240000,
  );
});
