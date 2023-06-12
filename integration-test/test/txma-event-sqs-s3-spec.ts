import {describe, expect, test} from '@jest/globals';
import * as fs from 'fs';
import {getEventListS3, getS3DataFileContent, publishToTxmaQueue} from '../helpers/lambda-helpers';
import {faker} from '@faker-js/faker';
import {getEventFilePrefix, poll} from "../helpers/common-helpers";

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function checkFileUploaded(contents: any, eventid: string) {
  for (const val of contents) {
    // console.log('FileName->' + val.Key)
    const fileData = await getS3DataFileContent(val.Key);
    const body : string = fileData.body;
    const filecontent = body.split("\n");
    const parsedContent = filecontent.map((line) => JSON.parse(line));
    const event = parsedContent.filter((line) => line.event_id === eventid);
    if (event.length > 0) {
      console.log('FileName Data->' + JSON.stringify(event));
      console.log('FileName ->' + val.Key);
      return true;
    }
  }
  return false;
}

const checkFileCreatedOnS3 = async (
  prefix: string,
  eventID: string,
  timeoutMs: number
): Promise<boolean> => {
  const pollS3BucketForEventIdString = async (): Promise<boolean> => {
    const result = await getEventListS3(prefix);
    if (result.Contents !== undefined) {
      if (result.Contents.length > 0) {
        result.Contents.sort((f1, f2) => Date.parse(f2.LastModified) - Date.parse(f1.LastModified))
        let fileUploaded = await checkFileUploaded(result.Contents, eventID);
        if (fileUploaded)
          return true;
        else
          return false;
      }
      return false;
    } else
      return false;
  };
  try {
    return await poll(pollS3BucketForEventIdString, (result) => result, {
      timeout: timeoutMs,
      nonCompleteErrorMessage: "EventId not exists within the timeout",
    });
  } catch (error) {
    return false;
  }
};

describe(
  "\n Happy path tests Publish valid TXMA Event to SQS and expect event id stored in S3\n",
  () => {
      test.concurrent.each`
      eventName            | event_id               | client_id              | journey_id
      ${'DCMAW_PASSPORT_SELECTED'} | ${faker.string.uuid()} | ${faker.string.uuid()} | ${faker.string.uuid()}
      ${'IPV_FRAUD_CRI_START'} | ${faker.string.uuid()} | ${faker.string.uuid()} | ${faker.string.uuid()}
    `('Should validate $eventName event content stored on S3', async ({ ...data }) => {
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
        expect(publishResult).toHaveProperty("MessageId");

        // given
        const prefix = await getEventFilePrefix(event.event_name);

        //then
        let fileUploaded= await checkFileCreatedOnS3(prefix, event.event_id, 100000);
        expect(fileUploaded).toEqual(true);

      },200000);

  });
