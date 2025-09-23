export interface RedshiftMetadata {
  database: string;
  schema: string;
  table: string;
  operation: string;
}

export interface RedshiftFileMetadata {
  bucket: string;
  file_path: string;
}

export interface RedshiftDatasource {
  ingestion_enabled_status: boolean;
  redshift_metadata: RedshiftMetadata;
}

export type RedshiftConfig = Record<string, { data_sources: Record<string, RedshiftDatasource> }>;
