/* eslint-disable no-console */

const red = (s: string) => `\x1b[31m${s}\x1b[0m`;
const green = (s: string) => `\x1b[32m${s}\x1b[0m`;

export const printResults = (
  tableName: string,
  expected: Record<string, string>,
  actual: Record<string, string | number>[],
) => {
  const columns = Object.keys(expected);
  const allRows = [expected, ...actual];
  const widths = columns.map(col => Math.max(col.length, ...allRows.map(row => String(row[col] ?? '').length)));
  const separator = '─'.repeat(10) + '┼' + widths.map(w => '─'.repeat(w + 2)).join('┼');
  const header = ' '.repeat(10) + '│' + columns.map((col, i) => ` ${col.padEnd(widths[i])} `).join('│');
  const formatRow = (row: Record<string, string | number>) =>
    columns.map((col, i) => ` ${String(row[col] ?? '').padEnd(widths[i])} `).join('│');

  const lines = [
    `\n📋 ${tableName}`,
    `  ${header}`,
    `  ${separator}`,
    `  ${'Expected'.padEnd(10)}│${formatRow(expected)}`,
  ];

  if (actual.length === 0) {
    lines.push(
      `  ${'Actual'.padEnd(10)}│${columns.map((_, i) => ' '.repeat(widths[i] + 2)).join('│')}  (no rows found) ❌`,
    );
  } else {
    for (const row of actual) {
      const mismatches: string[] = [];
      const cells = columns.map((col, i) => {
        const expectedVal = String(expected[col] ?? '');
        const actualVal = String(row[col] ?? '');
        const padded = ` ${actualVal.padEnd(widths[i])} `;
        if (expectedVal !== actualVal) {
          mismatches.push(col);
          return red(padded);
        }
        return green(padded);
      });
      const match = mismatches.length === 0;
      lines.push(`  ${'Actual'.padEnd(10)}│${cells.join('│')}  ${match ? '✅' : '❌'}`);
      if (!match) {
        lines.push(`\n  ⚠️  Mismatched columns: ${mismatches.join(', ')}`);
        for (const col of mismatches) {
          lines.push(
            `     ${col}: expected ${red(String(expected[col] ?? ''))} but got ${green(String(row[col] ?? ''))}`,
          );
        }
      }
    }
  }

  lines.push('');
  console.log(lines.join('\n'));
};
