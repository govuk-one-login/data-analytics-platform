// Validate Product Based Grouping in Stage Layer
import * as fs from 'fs';
import { getQueryResults } from '../helpers/db-helpers';
import { txmaProcessingWorkGroupName, txmaStageDatabaseName } from '../helpers/envHelper';
import { productFamily } from '../helpers/common-helpers';
import { DISTINCT_EVENT_NAME } from '../helpers/query-constant';

// verify grouping is done as defined in https://docs.google.com/spreadsheets/d/1U_WNH5nCxtc1UOhooCUS54aO6e-xaqxW4jvgVt-jNNQ/edit#gid=1517871112

const data = JSON.parse(fs.readFileSync('tests/data/eventList.json', 'utf-8'));

describe('Verify product family mapping in Stage Layer ', () => {
  // ******************** Copy files to s3 raw bucket ************************************

  test('Verify product family is mapped to the correct event in Stage Layer', async () => {
    for (let index = 0; index <= data.length - 1; index++) {
      const productFamilyGroupName = productFamily(data[index]);
      const athenaQueryResults = await getQueryResults(
        DISTINCT_EVENT_NAME + String(productFamilyGroupName),
        txmaStageDatabaseName(),
        txmaProcessingWorkGroupName(),
      );
      expect(JSON.stringify(athenaQueryResults)).toContain(String(data[index]));
    }
  }, 120000);
});
