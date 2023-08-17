import { redshiftRunQuery } from '../helpers/db-helpers';
import {
  DIM_DATE_COLUMNS,
  DIM_EVENT_COLUMNS,
  DIM_JOURNEY_CHANNEL,
  DIM_RELYING_PARTY_COLUMNS,
  DIM_VERIFICATION_ROUTE,
  FACT_USER_JOURNEY_EVENT,
} from '../helpers/query-constant';

describe('Redshift Data Model Validations', () => {
  test('Verify Redshift Database => DIM_DATE table metadata', async () => {
    const redShiftQueryResults = await redshiftRunQuery(DIM_EVENT_COLUMNS);
    // console.log('Data:' + JSON.stringify(redShiftQueryResults));
    expect(redShiftQueryResults).not.toBeNull();
  });
  test('Verify Redshift Database => DIM_DATE table metadata', async () => {
    const redShiftQueryResults = await redshiftRunQuery(DIM_DATE_COLUMNS);
    expect(redShiftQueryResults).not.toBeNull();
  });

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
  });
  test('Verify Redshift Database => DIM_JOURNEY_CHANNEL table metadata', async () => {
    const redShiftQueryResults = await redshiftRunQuery(DIM_JOURNEY_CHANNEL);
    expect(redShiftQueryResults).not.toBeNull();
  });
  test('Verify Redshift Database => FACT_USER_JOURNEY_EVENT table metadata', async () => {
    const redShiftQueryResults = await redshiftRunQuery(FACT_USER_JOURNEY_EVENT);
    expect(redShiftQueryResults).not.toBeNull();
  });
});
