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

interface AddUsersFromSpreadsheetEvent {
  spreadsheet: sheets_v4.Schema$ValueRange;
  dryRun?: boolean;
}

type AddUsersFromSpreadsheetResult = AddUsersEvent | LambdaInvokeResponse;

interface SpreadsheetRow {
  Name: string;
  Email: string;
  Type: string;
  'Quicksight group': string;
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
      quicksightGroups: [user['Quicksight group']],
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
  const columnNames = rows[0].map(name => name.trim());
  const nameIndex = columnNames.indexOf('Name');
  const emailIndex = columnNames.indexOf('Email');
  const typeIndex = columnNames.indexOf('Type');
  const groupIndex = columnNames.indexOf('Quicksight group');

  if ([nameIndex, emailIndex, typeIndex, groupIndex].includes(-1)) {
    throw new Error(`One or more column names missing - ${JSON.stringify(columnNames)}`);
  }

  return rows
    .slice(1)
    .filter(row => row.length === columnNames.length)
    .map(row => row.map(value => value.trim().toLowerCase()))
    .map(row => ({
      Name: row[nameIndex],
      Email: row[emailIndex],
      Type: row[typeIndex],
      'Quicksight group': row[groupIndex],
    }));
};

const getSpreadsheetRows = (range: sheets_v4.Schema$ValueRange): string[][] => {
  const rows = range?.values;
  if (rows === null || rows === undefined) {
    logger.error('Error getting spreadsheet rows', { range });
    throw new Error('Spreadsheet rows are missing or undefined');
  }
  return rows;
};
