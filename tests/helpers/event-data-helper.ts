import { faker } from '@faker-js/faker';
import { publishToTxmaQueue } from './lambda-helpers';
import { checkFileCreatedOnS3, checkFileCreatedOnS3kinesis } from './s3-helpers';
import fs from 'fs';
import { getErrorFilePrefix, getEventFilePrefix } from './common-helpers';
import { getQueryResults } from './db-helpers';
import { txmaStageDatabaseName, txmaProcessingWorkGroupName } from './envHelper';
import { stage_txma_stage_layer_no_extensions } from './query-constant';

export function setEventData(event, data: Pick<object, string | number | symbol>): void {
  event.event_id = data.event_id;
  event.client_id = faker.string.uuid();
  event.user.govuk_signin_journey_id = faker.string.uuid();
  event.event_name = data.eventName;
  const pastDate = faker.date.past();
  event.timestamp = Math.round(pastDate.getTime() / 1000);
  event.timestamp_formatted = JSON.stringify(pastDate);
}
export function setEventDataWithoutEventName(event, data: Pick<object, string | number | symbol>): void {
  event.client_id = data.client_id;
  event.user.govuk_signin_journey_id = data.journey_id;
  const pastDate = faker.date.past();
  event.timestamp = Math.round(pastDate.getTime() / 1000);
  event.timestamp_formatted = JSON.stringify(pastDate);
}
export function setExtensions(dataExtension, event): void {
  const listExtension = dataExtension.split(',');
  for (let index = 0; index <= listExtension.length - 1; index++) {
    if (listExtension[index] === 'ciFail') event.extensions.ciFail = 'true';
    if (listExtension[index] === 'hasMitigations') event.extensions.hasMitigations = 'false';
    if (listExtension[index] === 'levelOfConfidence') event.extensions.levelOfConfidence = 'P1';
  }
}
export function setEventDataWithoutUser(event, data: Pick<object, string | number | symbol>): void {
  event.event_id = data.event_id;
  event.client_id = data.client_id;
  event.event_name = data.eventName;
  const pastDate = faker.date.past();
  event.timestamp = Math.round(pastDate.getTime() / 1000);
  event.timestamp_formatted = JSON.stringify(pastDate);
}

export async function publishAndValidate(event): Promise<void> {
  const publishResult = await publishToTxmaQueue(event);
  // then
  expect(publishResult).not.toBeNull();
  expect(publishResult).toHaveProperty('MessageId');

  // givenx
  const prefix = getEventFilePrefix(event.event_name);

  // then
  const fileUploaded = await checkFileCreatedOnS3(prefix, event.event_id, 240000);
  expect(fileUploaded).toEqual(true);
}

export async function preparePublishAndValidate(
  data: Pick<object, string | number | symbol>,
  filePath: string,
): Promise<void> {
  const event = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  setEventData(event, data);
  // when
  await publishAndValidate(event);
}
export async function publishAndValidateError(event, errorCode: string): Promise<void> {
  const publishResult = await publishToTxmaQueue(event);
  // then
  expect(publishResult).not.toBeNull();
  // given
  const prefix = getErrorFilePrefix();
  // then
  const fileUploaded = await checkFileCreatedOnS3kinesis(prefix, errorCode, 440000);
  expect(fileUploaded).toEqual(true);
}

export async function preparePublishAndValidateError(
  data: Pick<object, string | number | symbol>,
  filePath: string,
  errorCode: string,
): Promise<void> {
  const event = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  setEventDataWithoutEventName(event, data);
  // when
  await publishAndValidateError(event, errorCode);
}

export async function basicChecksMethod(athenaRawQueryResults: string | any[]) {
  // This method checks basic values client_id,component_id, user_govuk_signin_journey_id, user_user_id from raw to Stage
  for (let index = 0; index <= athenaRawQueryResults.length - 1; index++) {
    const eventId = athenaRawQueryResults[index].event_id;
    const queryStage = `${stage_txma_stage_layer_no_extensions} where  event_id = '${eventId}'`;
    const athenaQueryStageResults: unknown = await getQueryResults(
      queryStage,
      txmaStageDatabaseName(),
      txmaProcessingWorkGroupName(),
    );
    expect(athenaRawQueryResults[index].client_id).toEqual(athenaQueryStageResults[0].client_id);
    expect(athenaRawQueryResults[index].component_id).toEqual(athenaQueryStageResults[0].component_id);
    const cleanedString = athenaRawQueryResults[index].user.replace(/[{}]/g, '');

    // Split the string into key-value pairs
    const keyValuePairs = cleanedString.split(',');
    // Initialize a variable to store the value of user_govuk_signin_journey_id
    let userGovukSigninJourneyId: string | undefined;
    let userId: string | undefined;

    // Iterate over each key-value pair
    keyValuePairs.forEach(pair => {
      // Split each pair into key and value
      const [key, value] = pair.split('=');
      // Check if the key is 'user_govuk_signin_journey_id'
      if (key.trim() === 'govuk_signin_journey_id') {
        // Store the value
        userGovukSigninJourneyId = value.trim() !== 'null' ? value.trim() : undefined;
      }

      if (key.trim() === 'user_id') {
        // Store the value
        userId = value.trim() !== 'null' ? value.trim() : undefined;
      }
    });
    expect(userGovukSigninJourneyId).toEqual(athenaQueryStageResults[0].user_govuk_signin_journey_id);
    expect(userId).toEqual(athenaQueryStageResults[0].user_user_id);
  }
}
