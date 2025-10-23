export const buildExpectedRawLayerRow = (data: {
  event_id: string;
  event_name: string;
  component_id: string;
  client_id: string;
  timestamp: number;
  timestamp_formatted: string;
  user: string;
  event_timestamp_ms: number;
  event_timestamp_ms_formatted: string;
  extensions: string;
  txma: string;
  datecreated: string;
}) => [
  // Header row
  {
    Data: [
      { VarCharValue: 'event_id' },
      { VarCharValue: 'event_name' },
      { VarCharValue: 'component_id' },
      { VarCharValue: 'client_id' },
      { VarCharValue: 'timestamp' },
      { VarCharValue: 'timestamp_formatted' },
      { VarCharValue: 'user' },
      { VarCharValue: 'event_timestamp_ms' },
      { VarCharValue: 'event_timestamp_ms_formatted' },
      { VarCharValue: 'extensions' },
      { VarCharValue: 'restricted' },
      { VarCharValue: 'txma' },
      { VarCharValue: 'datecreated' },
    ],
  },
  // Data row
  {
    Data: [
      ...Object.values(data)
        .slice(0, 9)
        .map(value => ({ VarCharValue: String(value) })),
      { VarCharValue: data.extensions },
      {}, // restricted field is always empty in raw layer
      { VarCharValue: data.txma },
      { VarCharValue: data.datecreated },
    ],
  },
];
