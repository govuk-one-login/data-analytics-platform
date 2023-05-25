import {describe, expect, test} from '@jest/globals';
import * as fs from "fs";
import {getTxmaDataFile, publishToTxma} from "../helper-lambda-utils";

describe('Publish TXMA Event', () => {
  test('Consume TXMA Event and generate corresponding data file', async () => {
    // given
    const event: string = fs.readFileSync('../fixtures/txma-event.json', "utf-8");
    // when
    const publishResult = await publishToTxma(event);

    // then
    expect(publishResult).not.toBeNull();
    expect(publishResult).toEqual('Successfully published');

    // given
    const expectedDataFileName = "a/b/event.json"

    // when
    const dataFile = await getTxmaDataFile(expectedDataFileName);

    // then
    expect(dataFile).not.toBeNull();
    expect(dataFile).toEqual("some expectation");
  });
});
