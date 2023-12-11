import { faker } from '@faker-js/faker';
import { publishAndValidate, setEventData } from '../helpers/event-data-helper';
import * as fs from 'fs';
import { publishToTxmaQueue } from '../helpers/lambda-helpers';
import { getErrorFilePrefix } from '../helpers/common-helpers';
import { checkFileCreatedOnS3kinesis } from '../helpers/s3-helpers';

// todo this passes but takes over 100 seconds. do we need to rethink this/can we remove firehose buffering in test?
describe('DCMAW_CRI GROUP batch 2 Test - valid TXMA Event to SQS and expect event id stored in S3', () => {
  test.concurrent.each`
    eventName                           | event_id               | client_id              | journey_id
    ${'DCMAW_ABORT_APP'}                  | ${faker.string.uuid()} | ${'authOrchestratorDocApp'} | ${faker.string.uuid()}
    ${'DCMAW_ABORT_WEB'}                  | ${faker.string.uuid()} | ${faker.string.uuid()} | ${faker.string.uuid()}
    ${'DCMAW_CRI_4XXERROR'}                  | ${faker.string.uuid()} | ${faker.string.uuid()} | ${faker.string.uuid()}
    ${'DCMAW_CRI_5XXERROR'}                  | ${faker.string.uuid()} | ${faker.string.uuid()} | ${faker.string.uuid()}
    ${'DCMAW_CRI_END'}                  | ${faker.string.uuid()} | ${faker.string.uuid()} | ${faker.string.uuid()}
    ${'DCMAW_HYBRID_BILLING_STARTED'}                  | ${faker.string.uuid()} | ${faker.string.uuid()} | ${faker.string.uuid()}
    ${'DCMAW_IPROOV_BILLING_STARTED'}                  | ${faker.string.uuid()} | ${faker.string.uuid()} | ${faker.string.uuid()}
    ${'DCMAW_IPROOV_BILLING_STARTED'}                  | ${faker.string.uuid()} | ${faker.string.uuid()} | ${faker.string.uuid()}
    ${'DCMAW_MISSING_CONTEXT_AFTER_ABORT'}                  | ${faker.string.uuid()} | ${faker.string.uuid()} | ${faker.string.uuid()}
    ${'DCMAW_MISSING_CONTEXT_AFTER_COMPLETION'}                  | ${faker.string.uuid()} | ${faker.string.uuid()} | ${faker.string.uuid()}
    ${'DCMAW_MISSING_CONTEXT_AFTER_COMPLETION'}                  | ${faker.string.uuid()} | ${faker.string.uuid()} | ${faker.string.uuid()}
    ${'DCMAW_READID_NFC_BILLING_STARTED'}                  | ${faker.string.uuid()} | ${faker.string.uuid()} | ${faker.string.uuid()}
    ${'DCMAW_REDIRECT_ABORT'}                  | ${faker.string.uuid()} | ${faker.string.uuid()} | ${faker.string.uuid()}
    ${'DCMAW_REDIRECT_SUCCESS'}                  | ${faker.string.uuid()} | ${faker.string.uuid()} | ${faker.string.uuid()}
    `(
    'Should validate $eventName event content stored on S3',
    async ({ ...data }) => {
      const filePath = 'tests/fixtures/txma-event-group_without_extensions.json';
      const event = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      setEventData(event, data);
      event.client_id = data.client_id;
      event.user.govuk_signin_journey_id = faker.string.uuid();
      event.user.user_id = faker.string.uuid();
      // console.log('Event Data' + JSON.stringify(event));
      await publishAndValidate(event);
    },
    440000,
  );
});
