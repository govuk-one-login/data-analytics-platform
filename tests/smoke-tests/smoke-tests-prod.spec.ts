import { getQueryResults, redshiftRunQuery } from '../helpers/db-helpers';

import { FACT_TABLE_EVENT_PROCESSED_TODAY, PROCESSED_EVENT_BY_NAME } from '../helpers/query-constant';
import { TodayDate, productFamily } from '../helpers/common-helpers';
import fs from 'fs';
import { txmaProcessingWorkGroupName, txmaStageDatabaseName } from '../helpers/envHelper';

const data = JSON.parse(fs.readFileSync('tests/data/eventList.json', 'utf-8'));
const countData = {};

describe('smoke tests for DAP services prod', () => {
  // 	    // ******************** Smoke Tests  ************************************

  test('Verify that records are processed today in stage data', async () => {
    for (let index = 0; index <= data.length - 1; index++) {
      const productFamilyGroupName = productFamily(data[index]);
      const athenaQueryResults = await getQueryResults(
        'SELECT * FROM ' + productFamilyGroupName + " where processed_date = '" + String(TodayDate()) + "' ;",
        txmaStageDatabaseName(),
        txmaProcessingWorkGroupName(),
      );
      expect(athenaQueryResults).not.toBeNull();
      expect(athenaQueryResults.length).toBeGreaterThan(1);
    }
  }, 120000);

  test('Verify that records are processed today in Redshift / Conformed Layer', async () => {
    const query = FACT_TABLE_EVENT_PROCESSED_TODAY + String(TodayDate());
    const redShiftQueryResults = await redshiftRunQuery(query);
    expect(redShiftQueryResults).not.toBeNull();
    expect(redShiftQueryResults.TotalNumRows).toBeGreaterThan(1);
  });

  test('Output the number of records processed for specific event type on todays date for Stage Data ', async () => {
    for (let index = 0; index <= data.length - 1; index++) {
      const productFamilyGroupName = productFamily(data[index]);
      const athenaQueryResults = await getQueryResults(
        'SELECT count(*) FROM ' + productFamilyGroupName + " where processed_date = '" + String(TodayDate()) + "' ;",
        txmaStageDatabaseName(),
        txmaProcessingWorkGroupName(),
      );
      expect(athenaQueryResults).not.toBeNull();
      countData[data[index]] = athenaQueryResults;
    }
  }, 24000000);

  test('Output the number of records processed for specific event type on todays date in Redshift / Conformed Layer', async () => {
    for (let index = 0; index <= data.length - 1; index++) {
      const query =
        PROCESSED_EVENT_BY_NAME + "'" + (data[index] as string) + "' and processed_date=" + String(TodayDate());
      const redShiftQueryResults = await redshiftRunQuery(query);
      expect(redShiftQueryResults).not.toBeNull();
      countData[data[index]] = redShiftQueryResults.TotalNumRows;
    }
  }, 24000000);
});
