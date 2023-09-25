import { faker } from '@faker-js/faker';
import { preparePublishAndValidate } from '../helpers/event-data-helper';

describe('IPV_CRI_ADDRESS GROUP Test - valid TXMA F2F Event without extension to SQS and expect event id stored in S3', () => {
  test.concurrent.each`
    eventName                    | event_id               | client_id              | journey_id
    ${'IPV_ADDRESS_CRI_END'}     | ${faker.string.uuid()} | ${faker.string.uuid()} | ${faker.string.uuid()}
    ${'IPV_ADDRESS_CRI_REQUEST_SENT'}     | ${faker.string.uuid()} | ${faker.string.uuid()} | ${faker.string.uuid()}
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
