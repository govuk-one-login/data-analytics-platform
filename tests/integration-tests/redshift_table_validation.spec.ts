import { redshiftRunQuery } from '../helpers/db-helpers';
import {
  DIM_DATE_COLUMNS,
  DIM_EVENT_BY_NAME,
  DIM_EVENT_COLUMNS,
  DIM_JOURNEY_CHANNEL,
  DIM_RELYING_PARTY_COLUMNS,
  DIM_VERIFICATION_ROUTE,
  FACT_USER_JOURNEY_EVENT,
} from '../helpers/query-constant';
import * as fs from 'fs';

describe('Redshift Data Model Validations', () => {
  test('Verify Redshift Database event data => DIM_EVENT_COLUMNS table metadata and event names', async () => {
    const expectedEvent = JSON.parse(fs.readFileSync('tests/data/eventList.json', 'utf-8'));
    const redShiftQueryResults = await redshiftRunQuery(DIM_EVENT_COLUMNS);
    expect(redShiftQueryResults).not.toBeNull();
    // expect(redShiftQueryResults.TotalNumRows).toEqual(expectedEvent.length);
    const actualEventNameList = [];
    for (let index = 0; index <= redShiftQueryResults.Records.length - 1; index++) {
      if (redShiftQueryResults.Records != null) {
        actualEventNameList.push(redShiftQueryResults.Records[index][0].stringValue);
      }
    }
    // console.log('Array Results:' + JSON.stringify(actualEventNameList.sort()));
    // console.log('Expected Results:' + JSON.stringify(expectedEvent.sort()));
    actualEventNameList.sort((a, b) => a.localeCompare(b));
    expectedEvent.sort((a, b) => a.localeCompare(b));
    expect(JSON.stringify(actualEventNameList) === JSON.stringify(expectedEvent)).toEqual(true);
  });
  test('Verify Redshift Database => DIM_DATE table metadata', async () => {
    const redShiftQueryResults = await redshiftRunQuery(DIM_DATE_COLUMNS);
    expect(redShiftQueryResults).not.toBeNull();
  }, 240000);

  test('Verify Redshift Database => DIM_RELYING_PARTY table metadata', async () => {
    const redShiftQueryResults = await redshiftRunQuery(DIM_RELYING_PARTY_COLUMNS);
    expect(redShiftQueryResults).not.toBeNull();
  });
  test('Verify Redshift Database => DIM_RELYING_PARTY table metadata', async () => {
    const redShiftQueryResults = await redshiftRunQuery(DIM_RELYING_PARTY_COLUMNS);
    expect(redShiftQueryResults).not.toBeNull();
  });
  test('Verify Redshift Database => DIM_VERIFICATION_ROUTE table metadata', async () => {
    const redShiftQueryResults = await redshiftRunQuery(DIM_VERIFICATION_ROUTE);
    expect(redShiftQueryResults).not.toBeNull();
    // console.log('Data Results:' + JSON.stringify(redShiftQueryResults.Records));
  });
  test('Verify Redshift Database => DIM_JOURNEY_CHANNEL table metadata', async () => {
    const redShiftQueryResults = await redshiftRunQuery(DIM_JOURNEY_CHANNEL);
    // console.log('Data:' + JSON.stringify(redShiftQueryResults));
    expect(redShiftQueryResults).not.toBeNull();
    expect(redShiftQueryResults.TotalNumRows).toEqual(3);
  });
  test('Verify Redshift Database => FACT_USER_JOURNEY_EVENT table metadata', async () => {
    const redShiftQueryResults = await redshiftRunQuery(FACT_USER_JOURNEY_EVENT);
    expect(redShiftQueryResults).not.toBeNull();
  });

  test('Verify Redshift Database => DIM_JOURNEY_CHANNEL table journey types', async () => {
    const redShiftQueryResults = await redshiftRunQuery(DIM_JOURNEY_CHANNEL);
    // console.log('Data:' + JSON.stringify(redShiftQueryResults));
    expect(redShiftQueryResults).not.toBeNull();
    // console.log('Data:' + JSON.stringify(redShiftQueryResults.Records[0][2].stringValue));
    expect(redShiftQueryResults.TotalNumRows).toEqual(3);
    const journeyChannel = [];
    if (redShiftQueryResults.Records != null) {
      for (let index = 0; index <= redShiftQueryResults.Records.length - 1; index++) {
        journeyChannel.push(redShiftQueryResults.Records[index][1].stringValue);
      }
    }
    journeyChannel.sort((a, b) => a.localeCompare(b));
    expect(journeyChannel[0]).toEqual('App');
    expect(journeyChannel[1]).toEqual('General');
    expect(journeyChannel[2]).toEqual('Web');
  });

  test.concurrent.each`
    family_name                           | journey_type
    ${'DCMAW_CRI'}                        | ${'DCMAW'}
    ${'AUTH_ORCHESTRATION'}               |${'Authentication'}
    ${'AUTH_ACCOUNT_USER_LOGIN'}          | ${'Authentication'}
    ${'AUTH_ACCOUNT_CREATION'}            | ${'Authentication'}
    ${'AUTH_ACCOUNT_MFA'}                 | ${'Authentication'}
    ${'AUTH_ACCOUNT_MANAGEMENT'}          | ${'Authentication'}
    ${'IPV_CRI_DRIVING_LICENSE'}          | ${'IPV'}
    ${'IPV_CRI_ADDRESS'}                  | ${'IPV'}
    ${'IPV_CRI_FRAUD'}                    | ${'IPV'}
    ${'IPV_CRI_KBV'}                      | ${'IPV'}
    ${'IPV_JOURNEY'}                      | ${'IPV'}
    ${'IPV_CRI_PASSPORT'}                 | ${'IPV'}
    `(
    'Should validate DIM Events names as expected by product family $family_name',
    async ({ ...data }) => {
      // given
      const expectedEvent = JSON.parse(
        fs.readFileSync('tests/data/event/' + (data.family_name as string).toLowerCase() + '_family.json', 'utf-8'),
      );
      const query = DIM_EVENT_BY_NAME + "'" + (data.family_name as string) + "'";

      const redShiftQueryResults = await redshiftRunQuery(query);
      const actualData = [];
      for (let index = 0; index <= redShiftQueryResults.Records.length - 1; index++) {
        if (redShiftQueryResults.Records != null) {
          actualData.push(redShiftQueryResults.Records[index][0].stringValue);
          expect(redShiftQueryResults.Records[index][1].stringValue).toEqual(data.journey_type);
        }
      }
      // console.log('Array Results:' + JSON.stringify(actualData.sort()));
      // console.log('Expected Results:' + JSON.stringify(expectedEvent).sort());
      actualData.sort((a, b) => a.localeCompare(b));
      expectedEvent.sort((a, b) => a.localeCompare(b));
      expect(JSON.stringify(actualData) === JSON.stringify(expectedEvent)).toEqual(true);
      expect(redShiftQueryResults.TotalNumRows).toEqual(expectedEvent.length);
    },
    240000,
  );
});
