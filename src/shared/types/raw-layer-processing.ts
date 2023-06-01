import type { GetQueryResultsOutput } from '@aws-sdk/client-athena';

export const RawLayerProcessingActions = ['GetPartitionQuery', 'GetInsertQuery'] as const;

export type RawLayerProcessingAction = (typeof RawLayerProcessingActions)[number];

export interface RawLayerProcessingEvent {
  datasource: string;
  S3MetaDataBucketName: string;
  action: RawLayerProcessingAction;
  configObject?: RawLayerProcessingConfigObject;
}

export interface RawLayerProcessingConfigObject {
  event_name: string;
  enabled: boolean;
  sqlText: unknown;
  queryResult: GetQueryResultsOutput;
}

export interface RawLayerEventStatus {
  event_name: string;
  enabled: boolean;
}
