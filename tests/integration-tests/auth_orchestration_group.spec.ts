import { faker } from '@faker-js/faker';
import {
  preparePublishAndValidate,
  preparePublishAndValidateError,
  publishAndValidate,
  setEventData,
} from '../helpers/event-data-helper';
import fs from 'fs';

// todo this passes but takes over 100 seconds. do we need to rethink this/can we remove firehose buffering in test?
describe('AUTH_ORCHESTRATION GROUP Test - valid TXMA Event to SQS and expect event id stored in S3', () => {
  test.concurrent.each`
    eventName                    | event_id               | client_id              | journey_id
    ${'AUTH_AUTHORISATION_INITIATED'}     | ${faker.string.uuid()} | ${faker.string.uuid()} | ${faker.string.uuid()}
    `(
    'Should validate $eventName event content stored on S3',
    async ({ ...data }) => {
      // given
      const filePath = 'tests/fixtures/txma-event-auth-orchestration-group.json';
      await preparePublishAndValidate(data, filePath);
    },
    340000,
  );
});
describe('AUTH_ORCHESTRATION GROUP Test - valid TXMA Event with extension to SQS and expect event id stored in S3', () => {
  test.concurrent.each`
    eventName                            | event_id               | client_id               | extensions              | journey_id
    ${'AUTH_AUTHORISATION_REQUEST_ERROR'}| ${faker.string.uuid()} | ${faker.string.uuid()}  |     ${'description'}                | ${faker.string.uuid()}
    ${'AUTH_IPV_AUTHORISATION_REQUESTED'}| ${faker.string.uuid()} | ${faker.string.uuid()}  |      ${'clientLandingPageUrl'}        | ${faker.string.uuid()}
    `(
    'Should validate $eventName event content stored on S3',
    async ({ ...data }) => {
      // given
      const filePath = 'tests/fixtures/txma-event-group_with_empty_extensions.json';
      const event = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      setEventData(event, data);
      if (data.extensions === 'description') event.extensions.description = 'Request Missing';
      else if (data.extensions === 'clientLandingPageUrl')
        event.extensions.clientLandingPageUrl = 'clientLandingPageUrl';
      // console.log('Event Data' + JSON.stringify(event));
      // when
      await publishAndValidate(event);
    },
    240000,
  );
});
describe('AUTH_ORCHESTRATION GROUP Test - valid TXMA F2F Event without extension to SQS and expect event id stored in S3', () => {
  test.concurrent.each`
    eventName                    | event_id               | client_id              | journey_id
    ${'AUTH_AUTHORISATION_REQUEST_RECEIVED'}     | ${faker.string.uuid()} | ${faker.string.uuid()} | ${faker.string.uuid()}
    `(
    'Should validate $eventName event content stored on S3',
    async ({ ...data }) => {
      // given
      const filePath = 'tests/fixtures/txma-event-group_without_extensions.json';
      await preparePublishAndValidate(data, filePath);
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
      // given
      const errorCode = 'DynamicPartitioning.MetadataExtractionFailed';
      const filePath = 'tests/fixtures/txma-event-invalid.json';
      await preparePublishAndValidateError(data, filePath, errorCode);
    },
    240000,
  );
});
