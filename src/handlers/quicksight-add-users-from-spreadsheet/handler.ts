import { getLogger } from '../../shared/powertools';
import type { sheets_v4 } from 'googleapis';
import { InvokeCommand } from '@aws-sdk/client-lambda';
import type { LambdaInvokeResponse } from '../../shared/utils/utils';
import {
  arrayPartition,
  getAccountId,
  getEnvironmentVariable,
  getErrorMessage,
  lambdaInvokeResponse,
  sleep,
} from '../../shared/utils/utils';
import { lambdaClient } from '../../shared/clients';
import { getUserStatus } from '../../shared/quicksight-access/user-status';
import type { Context } from 'aws-lambda';
import type { AddUsersEvent } from '../quicksight-add-users/handler';

const logger = getLogger('lambda/quicksight-add-users-from-spreadsheet');

const EXPECTED_COLUMNS = new Map<number, keyof SpreadsheetRow>([
  [0, 'Name'],
  [1, 'Email'],
  [2, 'Type'],
  [3, 'Government Service'],
]);

interface AddUsersFromSpreadsheetEvent {
  spreadsheet: sheets_v4.Schema$ValueRange;
  dryRun?: boolean;
}

type AddUsersFromSpreadsheetResult = AddUsersEvent | LambdaInvokeResponse;

interface SpreadsheetRow {
  Name: string;
  Email: string;
  Type: string;
  'Government Service': string;
}

export const handler = async (
  event: AddUsersFromSpreadsheetEvent,
  context: Context,
): Promise<AddUsersFromSpreadsheetResult> => {
  try {
    const rows = getSpreadsheetRows(event.spreadsheet);
    const users = getUsersFromRows(rows);
    logger.info('Parsed user rows from spreadsheet', { users, usersSize: users.length });
    const toBeAdded = await getUsersWithoutAccounts(users, context);
    logger.info('After filtering out users with accounts', { users: toBeAdded, usersSize: toBeAdded.length });
    return await sendToAddUsersLambda(toBeAdded, event.dryRun);
  } catch (error) {
    logger.error('Error preparing to add users', { error });
    throw error;
  }
};

const sendToAddUsersLambda = async (
  users: SpreadsheetRow[],
  dryRun?: boolean,
): Promise<AddUsersFromSpreadsheetResult> => {
  const addUsersEvent = {
    requests: users.map(user => ({
      username: user.Email,
      email: user.Email,
      quicksightGroups:
        user['Government Service'].length > 0 ? [user['Government Service'].toLowerCase()] : ['gds-users'],
    })),
  };

  if (dryRun === true) {
    return addUsersEvent;
  }

  logger.info('Sending event to add users lambda', { addUsersEvent });
  const request = new InvokeCommand({
    FunctionName: 'quicksight-add-users',
    Payload: JSON.stringify(addUsersEvent),
    LogType: 'Tail',
    InvocationType: 'RequestResponse',
  });

  try {
    const response = await lambdaClient.send(request);
    return lambdaInvokeResponse(response);
  } catch (error) {
    throw new Error(`Error calling add users lambda - ${getErrorMessage(error)}`);
  }
};

// brief check so the add users lambda is not called with an entire spreadsheet worth of users
// only filter out the case where user has accounts in both cognito and quicksight as this is going to be most common by some way
// the add user lambda can handle the edge-cases where the users exists in only one of the two services
const getUsersWithoutAccounts = async (users: SpreadsheetRow[], context: Context): Promise<SpreadsheetRow[]> => {
  try {
    const accountId = getAccountId(context);
    const userPoolId = getEnvironmentVariable('USER_POOL_ID');

    // have to do in batches to avoid Quicksight ThrottlingExceptions
    const maybeUsers: Array<SpreadsheetRow | undefined> = [];
    const batches = arrayPartition(users, 10);
    for (const batch of batches) {
      const maybeUser = await Promise.all(
        batch.map(async user => {
          const status = await getUserStatus(user.Email, userPoolId, accountId);
          return status.existsInBoth() ? undefined : user;
        }),
      );
      maybeUser.forEach(u => maybeUsers.push(u));
      await sleep(100);
    }

    // have to use the type guard otherwise typescript thinks the filter() output is (SpreadsheetRow | undefined)[]
    // see https://www.benmvp.com/blog/filtering-undefined-elements-from-array-typescript
    return maybeUsers.filter((user): user is SpreadsheetRow => user !== undefined);
  } catch (error) {
    throw new Error(`Error getting users without accounts - ${getErrorMessage(error)}`);
  }
};

const getUsersFromRows = (rows: string[][]): SpreadsheetRow[] => {
  const columnNames = getColumnNames(rows);
  const columnValues = getColumnValues(rows, columnNames);
  return columnValues.map(row => ({ Name: row[0], Email: row[1], Type: row[2], 'Government Service': row[3] ?? '' }));
};

const getColumnNames = (rows: string[][]): string[] => {
  const columnNames = rows[0];
  const columnCount = columnNames.length;
  if (columnCount < 3) {
    throw new Error(`Expected 3 or 4 columns - ${JSON.stringify(columnNames)}`);
  }

  const validColumns = columnNames.every((name, index) => EXPECTED_COLUMNS.get(index) === name);
  if (!validColumns) {
    throw new Error(`One or more columns missing or in wrong order - ${JSON.stringify(columnNames)}`);
  }
  return columnNames;
};

const getColumnValues = (rows: string[][], columnNames: string[]): string[][] => {
  // slice to exclude the first row which is the row of column names
  // filter to remove lines without values for all properties (e.g. a - line separating 2 blocks of RPs)
  // map to make sure all strings are trimmed and lowercase for consistency
  return rows
    .slice(1)
    .filter(row => row.length === columnNames.length)
    .map(row => row.map(value => value.trim().toLowerCase()));
};

const getSpreadsheetRows = (range: sheets_v4.Schema$ValueRange): string[][] => {
  const rows = range?.values;
  if (rows === null || rows === undefined) {
    logger.error('Error getting spreadsheet rows', { range });
    throw new Error('Spreadsheet rows are missing or undefined');
  }
  return rows;
};
