import { describe, expect, test } from '@jest/globals';
import * as fs from 'fs';
import {getEventListS3, getTxmaDataFile, publishToTxmaQueue} from '../helpers/lambda-utils';
import { faker } from '@faker-js/faker';

describe(
  "\n Happy path tests\n" +
  "\n Publish valid TXMA Event to SQS and expect event id stored in S3\n",
  () => {
    test("S3 should contain event id for valid SQS message", async () => {
    // given
      const event = JSON.parse(fs.readFileSync('integration-test/fixtures/txma-event.json', 'utf-8'));
      console.log(event);
      event.event_id = faker.string.uuid();
    // when
    const publishResult = await publishToTxmaQueue({"hello": "world"});
    // then
    expect(publishResult).not.toBeNull();
    expect(publishResult).toHaveProperty("MessageId");
      // given
      const expectedDataFilePrefix = getEventFilePrefix('DCMAW_CRI_START');
    // when
    const dataFile = await getEventListS3(expectedDataFilePrefix);
    // then
    expect(dataFile).not.toBeNull();
    expect(dataFile).toContain(`${event.event_id}.json`);
  });

  //   test.each`
  //   eventName            | event_id               | client_id              | journey_id
  //   ${'DCMAW_APP_START'} | ${faker.string.uuid()} | ${faker.string.uuid()} | ${faker.string.uuid()}
  // `('Should validate $eventName event content stored on S3', async ({ ...data }) => {
  //     // given
  //     const event = JSON.parse(fs.readFileSync('integration-test/fixtures/txma-event.json', 'utf-8'));
  //     event.event_id = data.event_id;
  //     event.client_id = data.client_id;
  //     event.user.govuk_signin_journey_id = data.journey_id;
  //     event.event_name = data.eventName;
  //
  //     const pastDate = faker.date.past();
  //     event.timestamp = pastDate.getTime();
  //     event.timestamp_formatted = JSON.stringify(pastDate);
  //
  //     // when
  //     const publishResult = await publishToTxmaQueue(event);
  //
  //     // then
  //     expect(publishResult).not.toBeNull();
  //     expect(publishResult).toHaveProperty("MessageId");
  //
  //     // given
  //     const expectedDataFileName = getEventFileKey(data.eventName, data.event_id);
  //
  //     // when
  //     const dataFile = await getTxmaDataFile(expectedDataFileName);
  //
  //     // then
  //     expect(dataFile).not.toBeNull();
  //     expect(dataFile).toEqual('some expectation');
  //   });

});
