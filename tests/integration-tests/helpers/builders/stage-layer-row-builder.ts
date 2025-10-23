type StageLayerInput = {
  event_id: string;
  client_id: string;
  component_id: string;
  timestamp: number;
  timestamp_formatted: string;
  user_govuk_signin_journey_id: string;
  user_user_id: string;
  partition_event_name: string;
  event_timestamp_ms: number;
  event_timestamp_ms_formatted: string;
  year: number;
  month: number;
  day: number;
  processed_time: number;
  processed_dt: number;
  event_name: string;
};

// Helper to build expected stage layer row structure matching Athena query results
export const buildExpectedStageLayerRow = (data: StageLayerInput) => [
  // Header row
  {
    Data: [
      { VarCharValue: 'event_id' },
      { VarCharValue: 'client_id' },
      { VarCharValue: 'component_id' },
      { VarCharValue: 'timestamp' },
      { VarCharValue: 'timestamp_formatted' },
      { VarCharValue: 'user_govuk_signin_journey_id' },
      { VarCharValue: 'user_user_id' },
      { VarCharValue: 'partition_event_name' },
      { VarCharValue: 'event_timestamp_ms' },
      { VarCharValue: 'event_timestamp_ms_formatted' },
      { VarCharValue: 'year' },
      { VarCharValue: 'month' },
      { VarCharValue: 'day' },
      { VarCharValue: 'processed_time' },
      { VarCharValue: 'processed_dt' },
      { VarCharValue: 'event_name' },
    ],
  },
  // Data row
  {
    Data: Object.values(data).map(value => ({ VarCharValue: String(value) })),
  },
];
