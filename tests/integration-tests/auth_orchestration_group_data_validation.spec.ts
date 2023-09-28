import { faker } from '@faker-js/faker';
import { preparePublishAndValidate } from '../helpers/event-data-helper';
import { getQueryResults } from '../helpers/db-helpers';
import { TodayDate } from '../helpers/common-helpers';
import { txmaProcessingWorkGroupName, txmaStageDatabaseName } from '../helpers/envHelper';
import { QUERY } from '../helpers/query-constant';


describe('AUTH_ORCHESTRATION GROUP Test -validate data at stage layer', () => {
  test.concurrent.each`
    eventName                    | event_id               | client_id              | journey_id
    ${'AUTH_AUTHORISATION_INITIATED'}     | ${faker.string.uuid()} | ${faker.string.uuid()} | ${faker.string.uuid()}
    ${'AUTH_AUTHORISATION_REQUEST_ERROR'}     | ${faker.string.uuid()} | ${faker.string.uuid()} | ${faker.string.uuid()}
    `(
    'Should validate $eventName event content stored on S3',
    async ({ ...data }) => {
        // given
        const filePath = 'tests/fixtures/txma-event-auth-orchestration-group.json';
        await preparePublishAndValidate(data, filePath);
      const athenaQueryResults = await getQueryResults(
        QUERY,
        txmaStageDatabaseName(),
        txmaProcessingWorkGroupName(),
      );
      console.log(JSON.stringify(athenaQueryResults))
    },
    240000,
  );
});

