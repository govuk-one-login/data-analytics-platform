import { redshiftRunQuery } from '../helpers/db-helpers';

import { FACT_TABLE_EVENT_PROCESSED_TODAY, PROCESSED_EVENT_BY_NAME } from '../helpers/query-constant';
import { TodayDate } from '../helpers/common-helpers';
import fs from 'fs';

describe('smoke tests for DAP services prod', () => {
  // 	    // ******************** Smoke Tests  ************************************

  test('Verify that records are processed today', async () => {
    const query = FACT_TABLE_EVENT_PROCESSED_TODAY + String(TodayDate());
    const redShiftQueryResults = await redshiftRunQuery(query);
    // console.log('Data:' + JSON.stringify(redShiftQueryResults));
    expect(redShiftQueryResults).not.toBeNull();
    expect(redShiftQueryResults.TotalNumRows).toBeGreaterThan(1);
  });

  test('Output the number of records processed for specific event type on todays date', async () => {
    const data = JSON.parse(fs.readFileSync('tests/data/eventList.json', 'utf-8'));
    const countData = {};
    for (let index = 0; index <= data.length - 1; index++) {
      const query =
        PROCESSED_EVENT_BY_NAME + "'" + (data[index] as string) + "' and processed_date=" + String(TodayDate());
      const redShiftQueryResults = await redshiftRunQuery(query);
      expect(redShiftQueryResults).not.toBeNull();
      countData[data[index]] = redShiftQueryResults.TotalNumRows;
    }
    // console.log('countData:' + JSON.stringify(countData));
  }, 24000000);
});
