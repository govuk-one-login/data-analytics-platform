import { describe, expect, test } from '@jest/globals';
import * as fs from 'fs';
import { getTxmaDataFile, publishToTxmaQueue } from '../helpers/lambda-utils';

describe('Publish TXMA Event', () => {
  test('Publish valid TXMA event to SQS and expect event id stored in S3', async () => {
    // given
    const event: string = fs.readFileSync('integration-test/fixtures/txma-event.json', 'utf-8');
    // when
    const publishResult = await publishToTxmaQueue(event);
    // then
    expect(publishResult).not.toBeNull();
    expect(publishResult).toEqual('Successfully published');
    // given
    const expectedDataFileName = 'a/b/event.json';
    // when
    const dataFile = await getTxmaDataFile(expectedDataFileName);
    // then
    expect(dataFile).not.toBeNull();
    expect(dataFile).toEqual('some expectation');
  });
});
