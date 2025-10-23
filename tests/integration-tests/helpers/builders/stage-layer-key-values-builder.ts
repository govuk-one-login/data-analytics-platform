type KeyValuesInput = {
  event_id: string;
  parent_column_name: string;
  key: string;
  value: string;
  processed_time: number;
  processed_dt: number;
};

// Helper to build expected stage layer key values structure
export const buildExpectedStageLayerKeyValues = (keyValuePairs: KeyValuesInput[]) => [
  // Header row
  {
    Data: [
      { VarCharValue: 'event_id' },
      { VarCharValue: 'parent_column_name' },
      { VarCharValue: 'key' },
      { VarCharValue: 'value' },
      { VarCharValue: 'processed_time' },
      { VarCharValue: 'processed_dt' },
    ],
  },
  // Data rows
  ...keyValuePairs.map(pair => ({
    Data: Object.values(pair).map(value => ({ VarCharValue: String(value) })),
  })),
];
