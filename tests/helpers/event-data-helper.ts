import { faker } from '@faker-js/faker';
import { publishToTxmaQueue } from './lambda-helpers';
import { checkFileCreatedOnS3, checkFileCreatedOnS3kinesis } from './s3-helpers';
import fs from 'fs';
import { getErrorFilePrefix, getEventFilePrefix } from './common-helpers';

export function setEventData(event, data: Pick<object, string | number | symbol>): void {
  event.event_id = data.event_id;
  event.client_id = data.client_id;
  event.user.govuk_signin_journey_id = data.journey_id;
  event.event_name = data.eventName;
  const pastDate = faker.date.past();
  event.timestamp = Math.round(pastDate.getTime() / 1000);
  event.timestamp_formatted = JSON.stringify(pastDate);
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
  setEventData(event, data);
  // when
  await publishAndValidateError(event, errorCode);
}
