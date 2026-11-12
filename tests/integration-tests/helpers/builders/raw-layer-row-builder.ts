type RawLayerInput = {
  event_id: string;
  event_name: string;
  component_id: string;
  client_id: string | null;
  timestamp: number;
  timestamp_formatted: string | null;
  user: string | null;
  event_timestamp_ms: number | null;
  event_timestamp_ms_formatted: string | null;
  extensions: string | null;
  restricted?: string | null;
  platform?: string | null;
  txma: string | null;
  datecreated: string;
};

export const buildExpectedRawLayerRow = (data: RawLayerInput) => [
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
      { VarCharValue: 'platform' },
      { VarCharValue: 'txma' },
      { VarCharValue: 'datecreated' },
    ],
  },
  // Data row
  {
    Data: [
      ...Object.values(data)
        .slice(0, 9)
        .map(value => (value === null ? {} : { VarCharValue: String(value) })),
      data.extensions === null ? {} : { VarCharValue: data.extensions },
      data.restricted === null || data.restricted === undefined ? {} : { VarCharValue: data.restricted },
      data.platform === null || data.platform === undefined ? {} : { VarCharValue: data.platform },
      data.txma === null ? {} : { VarCharValue: data.txma },
      { VarCharValue: data.datecreated },
    ],
  },
];
