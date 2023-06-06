import { describe, expect, test } from '@jest/globals';
import * as fs from 'fs';
import {getEventListS3, getTxmaDataFile, publishToTxmaQueue} from '../helpers/lambda-utils';
import { faker } from '@faker-js/faker';

describe(
  "\n Happy path tests\n" +
  "\n Publish valid TXMA Event to SQS and expect event id stored in S3\n",
  () => {
    test("S3 should contain event id for valid SNS message", async () => {
    // given
      const event = JSON.parse(fs.readFileSync('integration-test/fixtures/txma-event.json', 'utf-8'));
      event.event_id = faker.string.uuid();
    // when
    const publishResult = await publishToTxmaQueue(event);
    // then
    expect(publishResult).not.toBeNull();
    expect(publishResult).toHaveProperty("MessageId");
      // given
      const expectedDataFilePrefix = getEventFilePrefix('DCMAW_CRI_START');
    // when
    const dataFile = await getEventListS3(expectedDataFilePrefix);
    // then
    expect(dataFile).not.toBeNull();
    expect(dataFile).toContain(event.event_id);
  });

});
