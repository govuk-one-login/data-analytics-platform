import * as fs from 'fs';
import { getEventListS3, getS3DataFileContent, publishToTxmaQueue } from '../helpers/lambda-helpers';
import { faker } from '@faker-js/faker';
import { getEventFilePrefix, poll } from '../helpers/common-helpers';

interface S3ListEntry {
  Key: string;
  LastModified: string;
  ETag: string;
  Size: number;
  StorageClass: string;
}

async function checkFileUploaded(contents: S3ListEntry[], eventId: string): Promise<boolean> {
  for (const val of contents) {
    const fileData = await getS3DataFileContent(val.Key);
    const body = fileData.body as string;
    const fileContent = body.split('\n');
    const parsedContent = fileContent.map(line => JSON.parse(line));
    const event = parsedContent.filter(line => line.event_id === eventId);
    if (event.length > 0) {
      return true;
    }
  }
  return false;
}

const checkFileCreatedOnS3 = async (prefix: string, eventID: string, timeoutMs: number): Promise<boolean> => {
  const pollS3BucketForEventIdString = async (): Promise<boolean> => {
    const contents = await getEventListS3(prefix).then(result => result.Contents as S3ListEntry[]);
    if (contents !== undefined) {
      if (contents.length > 0) {
        contents.sort((f1, f2) => Date.parse(f2.LastModified) - Date.parse(f1.LastModified));
        return await checkFileUploaded(contents, eventID);
      }
    }
    return false;
  };
  return await poll(pollS3BucketForEventIdString, result => result, {
    timeout: timeoutMs,
    nonCompleteErrorMessage: 'File never got to S3 within the timeout',
  });
};

// todo this passes but takes over 100 seconds. do we need to rethink this/can we remove firehose buffering in test?
describe('Happy path tests Publish valid TXMA Event to SQS and expect event id stored in S3', () => {
  test.concurrent.each`
    eventName                    | event_id               | client_id              | journey_id
    ${'DCMAW_PASSPORT_SELECTED'} | ${faker.string.uuid()} | ${faker.string.uuid()} | ${faker.string.uuid()}
    ${'IPV_FRAUD_CRI_START'}     | ${faker.string.uuid()} | ${faker.string.uuid()} | ${faker.string.uuid()}
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
