/* eslint-disable no-console */
import { executeRedshiftQuery } from '../../../shared-test-code/aws/redshift/execute-redshift-query';
import { ExpectedConformData } from './derive-expected';

const red = (s: string) => `\x1b[31m${s}\x1b[0m`;
const green = (s: string) => `\x1b[32m${s}\x1b[0m`;

interface ConformResult {
  row: Record<string, string | number> | undefined;
  extensions: Record<string, string | number>[];
}

const CONFORM_BASE_QUERY = `SELECT
         f.event_id,
         f.component_id,
         de.event_name,
         duj.user_govuk_signin_journey_id,
         dd.date,
         du.user_id,
         djc.channel_name
       FROM conformed_refactored.fact_user_journey_event_refactored f
       LEFT JOIN conformed_refactored.dim_event_refactored de ON f.event_key = de.event_key
       LEFT JOIN conformed_refactored.dim_user_journey_event_refactored duj ON f.user_journey_key = duj.user_journey_key
       LEFT JOIN conformed_refactored.dim_date_refactored dd ON f.date_key = dd.date_key
       LEFT JOIN conformed_refactored.dim_user_refactored du ON f.user_key = du.user_key
       LEFT JOIN conformed_refactored.dim_journey_channel_refactored djc ON f.journey_channel_key = djc.journey_channel_key`;

const queryExtensions = async (eventId: string) =>
  executeRedshiftQuery(
    `SELECT parent_attribute_name, event_attribute_name, event_attribute_value
     FROM conformed_refactored.event_extensions_refactored
     WHERE event_id = '${eventId}'`,
  );

export const queryConformLayer = async (eventId: string): Promise<ConformResult> => {
  const [rows, extensions] = await Promise.all([
    executeRedshiftQuery(`${CONFORM_BASE_QUERY} WHERE f.event_id = '${eventId}'`),
    queryExtensions(eventId),
  ]);
  return { row: rows[0], extensions };
};

export const queryConformLayerByEventName = async (eventName: string): Promise<ConformResult> => {
  const rows = await executeRedshiftQuery(
    `${CONFORM_BASE_QUERY} WHERE de.event_name = '${eventName}' ORDER BY dd.date DESC LIMIT 1`,
  );
  const row = rows[0];
  const extensions = row?.event_id ? await queryExtensions(String(row.event_id)) : [];
  return { row, extensions };
};

export const printConformResults = (
  eventName: string,
  eventId: string,
  expected: ExpectedConformData,
  result: ConformResult,
): string[] => {
  const { row, extensions } = result;
  const mismatches: string[] = [];

  const columns = ['event_id', 'component_id', 'event_name', 'journey_id', 'date'] as const;
  const expectedRow = [
    expected.event_id,
    expected.component_id,
    expected.event_name,
    expected.user_govuk_signin_journey_id,
    expected.date,
  ];
  const actualRow = [
    String(row?.event_id ?? ''),
    String(row?.component_id ?? ''),
    String(row?.event_name ?? ''),
    String(row?.user_govuk_signin_journey_id || ''),
    String(row?.date ?? ''),
  ];

  const widths = columns.map((col, i) => Math.max(col.length, expectedRow[i].length, actualRow[i].length));

  const label = '          ';
  const separator = '─'.repeat(label.length) + '┼' + widths.map(w => '─'.repeat(w + 2)).join('┼');
  const header = label + '│' + columns.map((col, i) => ` ${col.padEnd(widths[i])} `).join('│');

  const expectedLine =
    'Expected'.padEnd(label.length) + '│' + expectedRow.map((v, i) => ` ${v.padEnd(widths[i])} `).join('│');

  const actualCells = actualRow.map((v, i) => {
    const match = v === expectedRow[i];
    if (!match) mismatches.push(columns[i]);
    const padded = ` ${v.padEnd(widths[i])} `;
    return match ? green(padded) : red(padded);
  });
  const allMatch = mismatches.length === 0;
  const actualLine = 'Actual'.padEnd(label.length) + '│' + actualCells.join('│') + `  ${allMatch ? '✅' : '❌'}`;

  const lines = [
    `\n📋 ${eventName} (${eventId})`,
    `  ${header}`,
    `  ${separator}`,
    `  ${expectedLine}`,
    `  ${actualLine}`,
  ];

  if (mismatches.length > 0) {
    lines.push(`\n  ⚠️  Mismatched: ${mismatches.join(', ')}`);
  }

  lines.push('');
  lines.push(`  user_id: ${row?.user_id ?? '(not found)'} (hashed)`);
  lines.push(`  channel_name: ${row?.channel_name ?? '(not found)'}`);

  if (extensions.length === 0) {
    lines.push('  extensions: none');
  } else {
    extensions.forEach((ext, i) => {
      const prefix = i === 0 ? '  extensions: ' : '              ';
      lines.push(`${prefix}${ext.parent_attribute_name}.${ext.event_attribute_name} = "${ext.event_attribute_value}"`);
    });
  }

  console.log(lines.join('\n'));
  return mismatches;
};

export const printConformCheckOnly = (eventName: string, result: ConformResult) => {
  const { row, extensions } = result;

  const fields = ['event_id', 'component_id', 'event_name', 'user_govuk_signin_journey_id', 'date'] as const;
  const values = fields.map(f => String(row?.[f] ?? ''));
  const widths = fields.map((f, i) => Math.max(f.length, values[i].length));

  const header = fields.map((f, i) => ` ${f.padEnd(widths[i])} `).join('│');
  const separator = widths.map(w => '─'.repeat(w + 2)).join('┼');
  const valueLine = values.map((v, i) => ` ${v.padEnd(widths[i])} `).join('│');

  const lines = [
    `\n📋 ${eventName}`,
    `  ${header}`,
    `  ${separator}`,
    `  ${valueLine}`,
    '',
    `  user_id: ${row?.user_id ?? '(not found)'} (hashed)`,
    `  channel_name: ${row?.channel_name ?? '(not found)'}`,
  ];

  if (extensions.length === 0) {
    lines.push('  extensions: none');
  } else {
    extensions.forEach((ext, i) => {
      const prefix = i === 0 ? '  extensions: ' : '              ';
      lines.push(`${prefix}${ext.parent_attribute_name}.${ext.event_attribute_name} = "${ext.event_attribute_value}"`);
    });
  }

  console.log(lines.join('\n'));
};
