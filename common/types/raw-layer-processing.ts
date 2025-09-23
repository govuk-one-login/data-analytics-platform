import type { GetQueryResultsOutput } from '@aws-sdk/client-athena';

export const RawLayerProcessingActions = ['GetPartitionQuery', 'GetInsertQuery'] as const;

export type RawLayerProcessingAction = (typeof RawLayerProcessingActions)[number];

export interface RawLayerProcessingEvent {
  datasource: string;
  S3MetaDataBucketName: string;
}

export interface AthenaGetConfigEvent extends RawLayerProcessingEvent {
  configFilePrefix: string;
}

export interface AthenaGetStatementEvent extends RawLayerProcessingEvent {
  action: RawLayerProcessingAction;
  configObject: RawLayerProcessingConfigObject;
}

export interface RawLayerProcessingConfigObject {
  event_name: string;
  product_family: string;
  enabled: boolean;
  sqlText: unknown;
  queryResult: GetQueryResultsOutput;
}

export interface RawLayerEventStatus {
  event_name: string;
  enabled: boolean;
}
