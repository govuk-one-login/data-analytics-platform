import { executeRedshiftQuery } from '../../../shared-test-code/aws/redshift/execute-redshift-query';
import { ExpectedConformData } from './derive-expected';

const red = (s: string) => `\x1b[31m${s}\x1b[0m`;
const green = (s: string) => `\x1b[32m${s}\x1b[0m`;
const dim = (s: string) => `\x1b[2m${s}\x1b[0m`;

const write = (text: string) => process.stdout.write(text + '\n');

export interface ConformResult {
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
         djc.channel_name,
         drp.client_id,
         f.event_timestamp_ms
       FROM conformed_refactored.fact_user_journey_event_refactored f
       LEFT JOIN conformed_refactored.dim_event_refactored de ON f.event_key = de.event_key
       LEFT JOIN conformed_refactored.dim_user_journey_event_refactored duj ON f.user_journey_key = duj.user_journey_key
       LEFT JOIN conformed_refactored.dim_date_refactored dd ON f.date_key = dd.date_key
       LEFT JOIN conformed_refactored.dim_user_refactored du ON f.user_key = du.user_key
       LEFT JOIN conformed_refactored.dim_journey_channel_refactored djc ON f.journey_channel_key = djc.journey_channel_key
       LEFT JOIN conformed_refactored.dim_relying_party_refactored drp ON f.relying_party_key = drp.relying_party_key`;

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

  const lines: string[] = [`\n📋 ${eventName} (${eventId})`];

  const fields: { label: string; expected: string; actual: string }[] = [
    { label: 'event_id', expected: expected.event_id, actual: String(row?.event_id ?? '') },
    { label: 'component_id', expected: expected.component_id, actual: String(row?.component_id ?? '') },
    { label: 'event_name', expected: expected.event_name, actual: String(row?.event_name ?? '') },
    {
      label: 'journey_id',
      expected: expected.user_govuk_signin_journey_id,
      actual: String(row?.user_govuk_signin_journey_id || ''),
    },
    { label: 'date', expected: expected.date, actual: String(row?.date ?? '') },
  ];

  const labelWidth = Math.max(...fields.map(f => f.label.length), 'channel_name'.length);
  lines.push('');
  fields.forEach(({ label, expected: exp, actual }) => {
    const match = exp === actual;
    if (!match) mismatches.push(label);
    if (match) {
      lines.push(`  ${label.padEnd(labelWidth)}  ${green(actual)}  ✅`);
    } else {
      lines.push(`  ${label.padEnd(labelWidth)}  ${red(actual)}  ❌`);
      lines.push(`  ${''.padEnd(labelWidth)}  ${dim(`expected: ${exp}`)}`);
    }
  });

  lines.push('');
  lines.push(`  ${'channel_name'.padEnd(labelWidth)}  ${row?.channel_name ?? '(not found)'}`);

  if (mismatches.length > 0) {
    lines.push(`\n  ⚠️  Mismatched: ${mismatches.join(', ')}`);
  }

  lines.push(`\n  ${dim('Extensions')}`);
  if (extensions.length === 0) {
    lines.push('  none');
  } else {
    extensions.forEach(ext => {
      lines.push(`  ${ext.parent_attribute_name}.${ext.event_attribute_name} = "${ext.event_attribute_value}"`);
    });
  }

  lines.push('');
  write(lines.join('\n'));
  return mismatches;
};

export interface ExpectedConformDataFull extends ExpectedConformData {
  user_id: string;
  channel_name: string;
  client_id: string;
  event_timestamp_ms: string;
  extensions: { parent_attribute_name: string; event_attribute_name: string; event_attribute_value: string }[];
}

export const printConformResultsFull = (
  eventName: string,
  eventId: string,
  expected: ExpectedConformDataFull,
  result: ConformResult,
  timing?: { setupDurationMs: number; testDurationMs: number },
): string[] => {
  const { row, extensions } = result;
  const mismatches: string[] = [];

  const lines: string[] = [`\n📋 ${eventName} (${eventId})`];

  // Vertical key/value fields
  const fields: { label: string; expected: string; actual: string }[] = [
    { label: 'event_id', expected: expected.event_id, actual: String(row?.event_id ?? '') },
    { label: 'component_id', expected: expected.component_id, actual: String(row?.component_id ?? '') },
    { label: 'event_name', expected: expected.event_name, actual: String(row?.event_name ?? '') },
    {
      label: 'journey_id',
      expected: expected.user_govuk_signin_journey_id,
      actual: String(row?.user_govuk_signin_journey_id || ''),
    },
    { label: 'date', expected: expected.date, actual: String(row?.date ?? '') },
    { label: 'user_id', expected: expected.user_id, actual: String(row?.user_id ?? '') },
    { label: 'channel_name', expected: expected.channel_name, actual: String(row?.channel_name ?? '') },
    { label: 'client_id', expected: expected.client_id, actual: String(row?.client_id ?? '') },
    {
      label: 'event_timestamp_ms',
      expected: expected.event_timestamp_ms,
      actual: String(row?.event_timestamp_ms ?? ''),
    },
  ];

  const labelWidth = Math.max(...fields.map(f => f.label.length));
  lines.push('');
  fields.forEach(({ label, expected: exp, actual }) => {
    const match = exp === actual;
    if (!match) mismatches.push(label);
    if (match) {
      lines.push(`  ${label.padEnd(labelWidth)}  ${green(actual)}  ✅`);
    } else {
      lines.push(`  ${label.padEnd(labelWidth)}  ${red(actual)}  ❌`);
      lines.push(`  ${''.padEnd(labelWidth)}  ${dim(`expected: ${exp}`)}`);
    }
  });

  // Extensions table
  const formatExt = (ext: Record<string, string | number>) =>
    `${ext.parent_attribute_name}.${ext.event_attribute_name} = "${ext.event_attribute_value}"`;
  const expectedExts = expected.extensions.map(formatExt);
  const actualExts = extensions.map(formatExt);

  lines.push(`\n  ${dim('Extensions')}`);
  if (expectedExts.length === 0 && actualExts.length === 0) {
    lines.push('  none');
  } else {
    const allExtKeys = Array.from(new Set([...expectedExts, ...actualExts]));
    allExtKeys.forEach(ext => {
      const inExpected = expectedExts.includes(ext);
      const inActual = actualExts.includes(ext);
      let status: string;
      if (inExpected && inActual) {
        status = '✅';
      } else if (inExpected && !inActual) {
        status = red('❌ missing');
        mismatches.push(`missing extension: ${ext}`);
      } else {
        status = dim('(extra)');
      }
      lines.push(`  ${ext}  ${status}`);
    });
  }

  const hasConfigVersion = extensions.some(
    ext => String(ext.parent_attribute_name) === 'txma' && String(ext.event_attribute_name) === 'configversion',
  );
  if (!hasConfigVersion) {
    mismatches.push('txma.configversion is missing');
    lines.push(`\n  ${red('⚠️  txma.configversion is missing')}`);
  }

  if (mismatches.length > 0) {
    lines.push(`\n  ⚠️  Mismatched: ${mismatches.join(', ')}`);
  }

  // Timing summary
  if (timing) {
    const setupSecs = Math.round(timing.setupDurationMs / 1000);
    const testSecs = (timing.testDurationMs / 1000).toFixed(1);
    const totalSecs = Math.round((timing.setupDurationMs + timing.testDurationMs) / 1000);
    lines.push(`\n  ⏱️  Setup: ${setupSecs}s │ Test: ${testSecs}s │ Total: ${totalSecs}s`);
  }

  lines.push('');
  write(lines.join('\n'));
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

  write(lines.join('\n'));
};
