import { faker } from '@faker-js/faker';
import { preparePublishAndValidate } from '../../helpers/event-data-helper';
import { getQueryResults } from '../../helpers/db-helpers';
import { AUTH_CODE_VERIFIED_DATA, QUERY } from '../../helpers/query-constant';
import { txmaProcessingWorkGroupName, txmaStageDatabaseName } from '../../helpers/envHelper';


describe('AUTH_ORCHESTRATION GROUP Test -validate data at stage layer', () => {
  test.concurrent.each`
    eventName                    | event_id               | client_id              | journey_id
    ${'AUTH_CODE_VERIFIED'}     | ${faker.string.uuid()} | ${faker.string.uuid()} | ${faker.string.uuid()}
    `(
    'Should validate $eventName event content stored on S3',
    async ({ ...data }) => {
      // given
      const athenaQueryResults = await getQueryResults(
        AUTH_CODE_VERIFIED_DATA,
        txmaStageDatabaseName(),
        txmaProcessingWorkGroupName(),
      );
      console.log(JSON.stringify(athenaQueryResults))
    },
    240000,
  );
});
