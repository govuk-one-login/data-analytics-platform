import { getLogger } from '../../shared/powertools';
import type { sheets_v4 } from 'googleapis';
import { InvokeCommand } from '@aws-sdk/client-lambda';
import { getAccountId, getEnvironmentVariable, getErrorMessage, lambdaInvokeResponse } from '../../shared/utils/utils';
import type { LambdaInvokeResponse } from '../../shared/utils/utils';
import { lambdaClient } from '../../shared/clients';
import { getUserStatus } from '../../shared/quicksight-access/user-status';
import type { Context } from 'aws-lambda';
import type { AddUsersEvent } from '../quicksight-add-users/handler';

const logger = getLogger('lambda/quicksight-add-users-from-spreadsheet');

const EXPECTED_COLUMNS = new Map<number, string>([
  [0, 'Name'],
  [1, 'Email'],
  [2, 'Type'],
  [3, 'Relying Party'],
]);

interface AddUsersFromSpreadsheetEvent {
  spreadsheet: sheets_v4.Schema$Spreadsheet;
  dryRun?: boolean;
}

type AddUsersFromSpreadsheetResult = AddUsersEvent | LambdaInvokeResponse;

interface SpreadsheetRow {
  Name: string;
  Email: string;
  Type: string;
  RelyingParty: string;
}

export const handler = async (
  event: AddUsersFromSpreadsheetEvent,
  context: Context,
): Promise<AddUsersFromSpreadsheetResult> => {
  try {
    const rowData = getSpreadsheetRows(event.spreadsheet);
    const users = getUsersFromRows(rowData);
    logger.info('Parsed user rows from spreadsheet', { users });
    const toBeAdded = await getUsersWithoutAccounts(users, context);
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
      quicksightGroups: user.RelyingParty.length > 0 ? [user.RelyingParty.toLowerCase()] : ['gds-users'],
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
    const maybeUsers = await Promise.all(
      users.map(async user => {
        const status = await getUserStatus(user.Email, userPoolId, accountId);
        return status.existsInBoth() ? undefined : user;
      }),
    );
    // have to use the type guard otherwise typescript thinks the filter() output is (SpreadsheetRow | undefined)[]
    // see https://www.benmvp.com/blog/filtering-undefined-elements-from-array-typescript
    return maybeUsers.filter((user): user is SpreadsheetRow => user !== undefined);
  } catch (error) {
    throw new Error(`Error getting users without accounts - ${getErrorMessage(error)}`);
  }
};

const getUsersFromRows = (rows: sheets_v4.Schema$RowData[]): SpreadsheetRow[] => {
  const columnNames = getColumnNames(rows);
  const columnValues = getColumnValues(rows, columnNames);

  const getColumnValue = (cells: sheets_v4.Schema$CellData[], columnName: string): string => {
    return getCellValue(cells[columnNames.indexOf(columnName)]).trim();
  };

  return columnValues.map(cells => ({
    Name: getColumnValue(cells, 'Name'),
    Email: getColumnValue(cells, 'Email'),
    Type: getColumnValue(cells, 'Type'),
    RelyingParty: getColumnValue(cells, 'Relying Party'),
  }));
};

const getColumnNames = (rows: sheets_v4.Schema$RowData[]): string[] => {
  const columnNames = getRowCells(rows[0]).map(getCellValue);
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

const getColumnValues = (rows: sheets_v4.Schema$RowData[], columnNames: string[]): sheets_v4.Schema$CellData[][] => {
  // slice(1) to exclude the first row which is the row of column names
  return (
    rows
      .slice(1)
      .map(getRowCells)
      // remove lines without values for all properties (e.g. a - line separating 2 blocks of RPs)
      .filter(cells => cells.length === columnNames.length)
      // remove lines with any strikethrough text as this indicates the user is no longer to be added
      .filter(cells => !cells.some(cell => isCellStrikethrough(cell)))
  );
};

const getSpreadsheetRows = (spreadsheet: sheets_v4.Schema$Spreadsheet): sheets_v4.Schema$RowData[] => {
  // should only be one sheet as we explicitly request either the GDS or RP user sheets
  const sheet = spreadsheet?.sheets?.at(0);
  if (sheet === undefined) {
    throw new Error(`Spreadsheet sheet is missing or undefined - ${JSON.stringify(spreadsheet)}`);
  }
  // should only be one set of data as you get one per requested range and we only request one range
  const rowData = sheet?.data?.at(0)?.rowData;
  if (rowData === undefined) {
    throw new Error(`Spreadsheet row data is missing or undefined - ${JSON.stringify(spreadsheet)}`);
  }
  return rowData;
};

const getRowCells = (row: sheets_v4.Schema$RowData): sheets_v4.Schema$CellData[] => row.values ?? [];

const getCellValue = (cell: sheets_v4.Schema$CellData): string => cell?.userEnteredValue?.stringValue ?? '';

const isCellStrikethrough = (cell: sheets_v4.Schema$CellData): boolean =>
  cell?.userEnteredFormat?.textFormat?.strikethrough ?? false;
