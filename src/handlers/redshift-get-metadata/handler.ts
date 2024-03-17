import { getLogger } from '../../shared/powertools';
import { getEnvironmentVariable, getRequiredParams, parseS3ResponseAsObject } from '../../shared/utils/utils';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { s3Client } from '../../shared/clients';

const logger = getLogger('lambda/redshift-get-metadata');

export interface RedshiftExtractMetadataEvent {
  fileMetadata: string;
}

interface RedshiftFileMetadata {
  bucket: string;
  file_path: string;
}

export type RedshiftConfig = Record<string, { data_sources: Record<string, RedshiftDatasource> }>;

interface RedshiftDatasource {
  ingestion_enabled_status: boolean;
  redshift_metadata: RedshiftMetadata;
}

interface RedshiftMetadata {
  database: string;
  schema: string;
  table: string;
  operation: string;
}

export const handler = async (event: RedshiftExtractMetadataEvent): Promise<string> => {
  try {
    const fileMetadata = getFileMetadata(event);
    const { bucket, file_path: filePath } = getRequiredParams(fileMetadata, 'bucket', 'file_path');
    const configFileBucket = getEnvironmentVariable('METADATA_BUCKET_NAME');
    logger.info('Getting redshift metadata', { bucket, filePath });

    const filePathParts = getFilePathParts(filePath);
    logger.info('Extracted file path parts', { filePathParts });

    const configFile = await getConfigFile(configFileBucket, filePathParts.configRef);
    logger.info('Retrieved config file', { configFile });
    return getMetadata(configFile, filePathParts.dashboardRef, filePathParts.dataSource);
  } catch (error) {
    logger.error('Error getting redshift metadata', { error });
    throw error;
  }
};

const getFileMetadata = (event: RedshiftExtractMetadataEvent): RedshiftFileMetadata => {
  const { fileMetadata } = getRequiredParams(event, 'fileMetadata');
  return JSON.parse(fileMetadata);
};

const getFilePathParts = (filePath: string): { configRef: string; dashboardRef: string; dataSource: string } => {
  const matches = /reference-data\/(.+)\/(.+)\/\d+\/(.+)_\d{4}.+/.exec(filePath);
  if (matches === null) {
    throw new Error(`Unable to parse key path string "${filePath}"`);
  }
  return {
    configRef: matches[1],
    dashboardRef: matches[2],
    dataSource: matches[3],
  };
};

const getConfigFile = async (bucket: string, configRef: string): Promise<RedshiftConfig> => {
  const response = await s3Client.send(
    new GetObjectCommand({
      Bucket: bucket,
      Key: `reference_data/configuration_files/${configRef}_reference_data_configuration.json`,
    }),
  );
  return await parseS3ResponseAsObject(response);
};

const getMetadata = (configFile: RedshiftConfig, dashboardRef: string, dataSource: string): string => {
  const metadata = configFile[dashboardRef].data_sources[dataSource].redshift_metadata;
  if (metadata === null || metadata === undefined) {
    logger.error('Could not get metadata from config file', { configFile, dashboardRef, dataSource });
    throw new Error('Metadata was null or undefined');
  }
  return JSON.stringify(metadata);
};
