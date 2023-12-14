import { faker } from '@faker-js/faker';
import { publishAndValidate, setEventData } from '../helpers/event-data-helper';
import * as fs from 'fs';

// todo this passes but takes over 100 seconds. do we need to rethink this/can we remove firehose buffering in test?
describe('IPV GROUP batch 2 Test - valid TXMA Event to SQS and expect event id stored in S3', () => {
  test.concurrent.each`
    eventName                           | event_id               | client_id              | journey_id
    ${'IPV_DL_CRI_END'}                  | ${faker.string.uuid()} | ${faker.string.uuid()} | ${faker.string.uuid()}
    ${'IPV_DL_CRI_REQUEST_SENT'}                  | ${faker.string.uuid()} | ${faker.string.uuid()} | ${faker.string.uuid()}
    ${'IPV_DL_CRI_RESPONSE_RECEIVED'}                  | ${faker.string.uuid()} | ${faker.string.uuid()} | ${faker.string.uuid()}
    ${'IPV_FRAUD_CRI_END'}                  | ${faker.string.uuid()} | ${faker.string.uuid()} | ${faker.string.uuid()}
    ${'IPV_KBV_CRI_END'}                  | ${faker.string.uuid()} | ${faker.string.uuid()} | ${faker.string.uuid()}
    ${'IPV_KBV_CRI_REQUEST_SENT'}                  | ${faker.string.uuid()} | ${faker.string.uuid()} | ${faker.string.uuid()}
    ${'IPV_KBV_CRI_RESPONSE_RECEIVED'}                  | ${faker.string.uuid()} | ${faker.string.uuid()} | ${faker.string.uuid()}
    ${'IPV_PASSPORT_CRI_END'}                  | ${faker.string.uuid()} | ${faker.string.uuid()} | ${faker.string.uuid()}
    ${'IPV_PASSPORT_CRI_REQUEST_SENT'}                  | ${faker.string.uuid()} | ${faker.string.uuid()} | ${faker.string.uuid()}
    ${'IPV_PASSPORT_CRI_RESPONSE_RECEIVED'}                  | ${faker.string.uuid()} | ${faker.string.uuid()} | ${faker.string.uuid()}
    ${'IPV_CORE_CRI_RESOURCE_RETRIEVED'}                  | ${faker.string.uuid()} | ${faker.string.uuid()} | ${faker.string.uuid()}
    ${'IPV_CRI_AUTH_RESPONSE_RECEIVED'}                  | ${faker.string.uuid()} | ${faker.string.uuid()} | ${faker.string.uuid()}
    ${'IPV_DELETE_USER_DATA'}                  | ${faker.string.uuid()} | ${faker.string.uuid()} | ${faker.string.uuid()}
    ${'IPV_GPG45_PROFILE_MATCHED'}                  | ${faker.string.uuid()} | ${faker.string.uuid()} | ${faker.string.uuid()}
    ${'IPV_REDIRECT_TO_CRI'}                  | ${faker.string.uuid()} | ${faker.string.uuid()} | ${faker.string.uuid()}
    ${'IPV_SPOT_REQUEST_RECEIVED'}                  | ${faker.string.uuid()} | ${faker.string.uuid()} | ${faker.string.uuid()}
    ${'IPV_SPOT_REQUEST_VALIDATION_FAILURE'}                  | ${faker.string.uuid()} | ${faker.string.uuid()} | ${faker.string.uuid()}
    ${'IPV_VC_RECEIVED'}                  | ${faker.string.uuid()} | ${faker.string.uuid()} | ${faker.string.uuid()}
    `(
    'Should validate $eventName event content stored on S3',
    async ({ ...data }) => {
      let filePath = 'tests/fixtures/txma-event-group_without_extensions.json';
      if (data.eventName === 'IPV_GPG45_PROFILE_MATCHED') {
        filePath = 'tests/fixtures/txma-event-ipv-gpg45-profile-matched.json';
      }
      const event = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      setEventData(event, data);
      event.client_id = data.client_id;
      event.user.govuk_signin_journey_id = faker.string.uuid();
      event.user.user_id = faker.string.uuid();
      // console.log('Event Data' + JSON.stringify(event));
      await publishAndValidate(event);
    },
    440000,
  );
});
