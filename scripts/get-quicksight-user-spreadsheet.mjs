import { Auth, google } from 'googleapis';

const USER_TYPE = process.argv[2];
if (USER_TYPE === undefined || (USER_TYPE !== 'GDS' && USER_TYPE !== 'RP')) {
  throw new Error('User type required as parameter 1 (and must be one of [GDS, RP])');
}

const GOOGLE_CLOUD_SERVICE_ACCOUNT_CREDENTIALS = process.argv[3];
if (GOOGLE_CLOUD_SERVICE_ACCOUNT_CREDENTIALS === undefined) {
  throw new Error('Base64 encoded service account credentials required as parameter 2');
}

const getAuth = async () => {
  try {
    const credentials = Buffer.from(GOOGLE_CLOUD_SERVICE_ACCOUNT_CREDENTIALS, 'base64').toString('utf-8');
    const auth = new Auth.GoogleAuth({
      credentials: JSON.parse(credentials),
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });
    return await auth.getClient();
  } catch (e) {
    console.error('Error getting authentication', e instanceof Error ? e.message : JSON.stringify(e));
  }
};

// see https://developers.google.com/sheets/api/reference/rest/v4/spreadsheets.values/get for the API we are using
const getSpreadsheetData = async () => {
  try {
    const auth = await getAuth();
    const sheets = google.sheets({ version: 'v4', auth });
    return await sheets.spreadsheets.values.get({
      spreadsheetId: '1VK5ZNMzh4NrHNrsu1s0GnWhwcPoDVNZiGdQ4IONN2tI',
      range: USER_TYPE === 'GDS' ? "'Internal Quicksight reader accounts'!A:C" : "'RP Quicksight reader accounts'!A:D",
    });
  } catch (e) {
    console.error('Error getting spreadsheet contents', e instanceof Error ? e.message : JSON.stringify(e));
  }
};

getSpreadsheetData().then(response => console.log(JSON.stringify(response.data)));
