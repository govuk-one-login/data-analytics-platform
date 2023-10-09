import { faker } from '@faker-js/faker';
import {
  preparePublishAndValidate,
  publishAndValidate,
  setEventData,
  setEventDataWithoutUser,
  setExtensions,
} from '../helpers/event-data-helper';
import fs from 'fs';

describe('IPV_CRI_CIC GROUP Test - valid TXMA F2F Event without extension to SQS and expect event id stored in S3', () => {
  test.concurrent.each`
    eventName                    | event_id               | client_id              | journey_id
    ${'CIC_CRI_AUTH_CODE_ISSUED'}     | ${faker.string.uuid()} | ${faker.string.uuid()} | ${faker.string.uuid()}
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

describe('IPV_CRI_CIC GROUP Test - valid TXMA F2F Event with client id to SQS and expect event id stored in S3', () => {
  test.concurrent.each`
    eventName                    | event_id               | client_id              | journey_id
    ${'CIC_CRI_AUTH_CODE_ISSUED'}     | ${faker.string.uuid()} | ${faker.string.uuid()} | ${faker.string.uuid()}
    ${'CIC_CRI_START'}     | ${faker.string.uuid()} | ${faker.string.uuid()} | ${faker.string.uuid()}
    `(
    'Should validate $eventName event content stored on S3',
    async ({ ...data }) => {
      // given
      const filePath = 'tests/fixtures/txma-event-ipv-cri-cic-group.json';
      const event = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      setEventData(event, data);
      event.client_id = faker.string.uuid();
      // when
      await publishAndValidate(event);
    },
    240000,
  );
});

describe('IPV_CRI_CIC GROUP Test - valid TXMA F2F Event without user details to SQS and expect event id stored in S3', () => {
  test.concurrent.each`
    eventName                    | event_id               | client_id              | journey_id
    ${'CIC_CRI_AUTH_CODE_ISSUED'}     | ${faker.string.uuid()} | ${faker.string.uuid()} | ${faker.string.uuid()}
    ${'CIC_CRI_START'}     | ${faker.string.uuid()} | ${faker.string.uuid()} | ${faker.string.uuid()}
    `(
    'Should validate $eventName event content stored on S3',
    async ({ ...data }) => {
      // given
      const filePath = 'tests/fixtures/txma-event-group_without_extensions_user.json';
      const event = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      setEventDataWithoutUser(event, data);
      event.client_id = faker.string.uuid();
      // when
      await publishAndValidate(event);
    },
    240000,
  );
  describe('IPV_IDENTITY_ISSUED GROUP Test - valid TXMA Event with extension to SQS and expect event id stored in S3', () => {
    test.concurrent.each`
    eventName                            | event_id          | extensions          
    ${'IPV_IDENTITY_ISSUED'}| ${faker.string.uuid()}  |     ${'ciFail,hasMitigations'}         
    ${'IPV_IDENTITY_ISSUED'}| ${faker.string.uuid()}  |     ${'levelOfConfidence'}         
    ${'IPV_IDENTITY_ISSUED'}| ${faker.string.uuid()}  |     ${'ciFail,levelOfConfidence'}         
    `(
      'Should validate $eventName event content stored on S3 with extension as $extensions',
      async ({ ...data }) => {
        // given
        const filePath = 'tests/fixtures/txma-event-group_with_empty_extensions.json';
        const event = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        setEventData(event, data);
        event.extensions.levelOfConfidence = 'P0';
        // console.log('Event Data' + JSON.stringify(listExtension));
        setExtensions(data.extensions, event);
        // console.log('Event Data' + JSON.stringify(event));
        await publishAndValidate(event);
      },
      240000,
    );
  });
});
