import { faker } from '@faker-js/faker';
import { publishAndValidate, setEventData, setEventDataWithoutUser } from '../helpers/event-data-helper';
import fs from 'fs';

describe('IPV_CRI_F2F GROUP Test - valid TXMA Event with client id to SQS and expect event id stored in S3', () => {
  test.concurrent.each`
    eventName                    | event_id               | client_id              | journey_id
    ${'F2F_CRI_AUTH_CODE_ISSUED'}     | ${faker.string.uuid()} | ${faker.string.uuid()} | ${faker.string.uuid()}
    ${'F2F_CRI_START'}     | ${faker.string.uuid()} | ${faker.string.uuid()} | ${faker.string.uuid()}
    ${'F2F_YOTI_PDF_EMAILED'}     | ${faker.string.uuid()} | ${faker.string.uuid()} | ${faker.string.uuid()}
    ${'F2F_YOTI_START'}     | ${faker.string.uuid()} | ${faker.string.uuid()} | ${faker.string.uuid()}
    `(
    'Should validate $eventName event content stored on S3',
    async ({ ...data }) => {
      // given
      const filePath = 'tests/fixtures/txma-event-group_without_extensions.json';
      const event = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      setEventData(event, data);
      event.client_id = faker.string.uuid();
      // when
      await publishAndValidate(event);
    },
    240000,
  );
});
describe('IPV_CRI_F2F GROUP Test - valid TXMA Event without client id to SQS and expect event id stored in S3', () => {
  test.concurrent.each`
    eventName                    | event_id               | client_id              | journey_id
    ${'IPV_F2F_CRI_VC_CONSUMED'}     | ${faker.string.uuid()} | ${faker.string.uuid()} | ${faker.string.uuid()}
    `(
    'Should validate $eventName event content stored on S3',
    async ({ ...data }) => {
      // given
      const filePath = 'tests/fixtures/txma-event-group_without_extensions.json';
      const event = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      setEventData(event, data);
      // console.log('Event Data' + JSON.stringify(event));
      // when
      await publishAndValidate(event);
    },
    240000,
  );
});
describe('IPV_CRI_F2F GROUP Test - valid TXMA Event with previous signin journey id  to SQS and expect event id stored in S3', () => {
  test.concurrent.each`
    eventName                    | event_id               | client_id              | journey_id
    ${'F2F_YOTI_RESPONSE_RECEIVED'}     | ${faker.string.uuid()} | ${faker.string.uuid()} | ${faker.string.uuid()}
    ${'IPR_RESULT_NOTIFICATION_EMAILED'}     | ${faker.string.uuid()} | ${faker.string.uuid()} | ${faker.string.uuid()}
    ${'IPR_USER_REDIRECTED'}     | ${faker.string.uuid()} | ${faker.string.uuid()} | ${faker.string.uuid()}
    `(
    'Should validate $eventName event content stored on S3',
    async ({ ...data }) => {
      // given
      const filePath = 'tests/fixtures/txma-event-group_with_user_empty_extensions.json';
      const event = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      setEventData(event, data);
      event.extensions.previous_govuk_signin_journey_id = faker.string.uuid();
      // when
      await publishAndValidate(event);
    },
    240000,
  );
});

describe('IPV_CRI_F2F GROUP Test - valid TXMA Event F2F_CRI_VC_ISSUED to SQS and expect event id stored in S3', () => {
  test.concurrent.each`
    eventName                    | event_id               | client_id              | journey_id
    ${'F2F_CRI_VC_ISSUED'}     | ${faker.string.uuid()} | ${faker.string.uuid()} | ${faker.string.uuid()}
    `(
    'Should validate $eventName event content stored on S3',
    async ({ ...data }) => {
      // given
      const filePath = 'tests/fixtures/txma-event-group_f2f_cri.json';
      const event = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      setEventData(event, data);
      event.client_id = faker.string.uuid();
      // when
      await publishAndValidate(event);
    },
    240000,
  );
});
describe('IPV_CRI_F2F GROUP Test - valid TXMA Event IPV_F2F_CRI_VC_RECEIVED to SQS and expect event id stored in S3', () => {
  test.concurrent.each`
    eventName                    | event_id               | client_id              | journey_id
    ${'IPV_F2F_CRI_VC_RECEIVED'}     | ${faker.string.uuid()} | ${faker.string.uuid()} | ${faker.string.uuid()}
    `(
    'Should validate $eventName event content stored on S3',
    async ({ ...data }) => {
      // given
      const filePath = 'tests/fixtures/txma-event-group_f2f_cri_vc_issued.json';
      const event = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      setEventData(event, data);
      event.client_id = faker.string.uuid();
      // when
      await publishAndValidate(event);
    },
    240000,
  );
});
describe('IPV_CRI_F2F GROUP Test - valid TXMA F2F Event without user details to SQS and expect event id stored in S3', () => {
  test.concurrent.each`
    eventName                    | event_id               | client_id              | journey_id
    ${'F2F_CRI_AUTH_CODE_ISSUED'}     | ${faker.string.uuid()} | ${faker.string.uuid()} | ${faker.string.uuid()}
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
});
describe('IPV_CRI_F2F GROUP Test - valid TXMA Event with extensions to SQS and expect event id stored in S3', () => {
  test.concurrent.each`
    eventName                    | event_id               | client_id              | journey_id
    ${'F2F_CRI_AUTH_CODE_ISSUED'}     | ${faker.string.uuid()} | ${faker.string.uuid()} | ${faker.string.uuid()}
    ${'F2F_CRI_START'}     | ${faker.string.uuid()} | ${faker.string.uuid()} | ${faker.string.uuid()}
    ${'F2F_CRI_VC_ISSUED'}     | ${faker.string.uuid()} | ${faker.string.uuid()} | ${faker.string.uuid()}
    ${'F2F_YOTI_PDF_EMAILED'}     | ${faker.string.uuid()} | ${faker.string.uuid()} | ${faker.string.uuid()}
    ${'F2F_YOTI_START'}     | ${faker.string.uuid()} | ${faker.string.uuid()} | ${faker.string.uuid()}
    ${'IPR_RESULT_NOTIFICATION_EMAILED'}     | ${faker.string.uuid()} | ${faker.string.uuid()} | ${faker.string.uuid()}
    ${'IPR_USER_REDIRECTED'}     | ${faker.string.uuid()} | ${faker.string.uuid()} | ${faker.string.uuid()}
    ${'IPV_F2F_CRI_VC_CONSUMED'}     | ${faker.string.uuid()} | ${faker.string.uuid()} | ${faker.string.uuid()}
    ${'IPV_F2F_CRI_VC_RECEIVED'}     | ${faker.string.uuid()} | ${faker.string.uuid()} | ${faker.string.uuid()}
    ${'F2F_YOTI_RESPONSE_RECEIVED'}     | ${faker.string.uuid()} | ${faker.string.uuid()} | ${faker.string.uuid()}
    `(
    'Should validate $eventName event content stored on S3',
    async ({ ...data }) => {
      // given
      const filePath = 'tests/fixtures/txma-event-group_f2f_cri_vc_issued.json';
      const event = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      setEventData(event, data);
      event.client_id = faker.string.uuid();
      // when
      await publishAndValidate(event);
    },
    240000,
  );
});
