import { logger, initialiseLogger } from '../../shared/logger';
import { buildErrorMetadata, getEnvironmentVariable, getRequiredParams } from '../../shared/utils/utils';
import { ERROR_CODES } from '../../shared/error-codes';
import type { RedshiftConfig, RedshiftFileMetadata } from '../../shared/types/redshift-metadata';
import { getConfigFile, getFilePathParts } from '../../shared/manual-reference-data-ingestion/redshift-metadata';
import type { Context } from 'aws-lambda';

export interface RedshiftGetMetadataEvent {
  fileMetadata: string;
}

export const handler = async (event: RedshiftGetMetadataEvent, context?: Context): Promise<string> => {
  if (context !== undefined) {
    initialiseLogger(context);
  }
  const startTime = Date.now();
  const correlationId = context?.awsRequestId;
  logger.info('Redshift get metadata handler started', { correlationId });

  try {
    const fileMetadata = getFileMetadata(event);
    const { bucket, file_path: filePath } = getRequiredParams(fileMetadata, 'bucket', 'file_path');
    const configFileBucket = getEnvironmentVariable('METADATA_BUCKET_NAME');
    logger.info('Getting redshift metadata', { correlationId, bucket, filePath });

    const filePathParts = getFilePathParts(filePath);
    logger.info('Extracted file path parts', { correlationId, filePathParts });

    const configFile = await getConfigFile(configFileBucket, filePathParts.configRef);
    logger.info('Retrieved config file', { correlationId, configRef: filePathParts.configRef });
    const metadata = getMetadata(configFile, filePathParts.dashboardRef, filePathParts.dataSource, correlationId);
    logger.info('Redshift get metadata handler completed', {
      correlationId,
      outcome: 'success',
      duration: Date.now() - startTime,
    });
    return metadata;
  } catch (error) {
    logger.error('Error getting redshift metadata', {
      correlationId,
      outcome: 'failure',
      duration: Date.now() - startTime,
      error: buildErrorMetadata(error, ERROR_CODES.GET_METADATA_FAILED),
    });
    throw error;
  }
};

const getFileMetadata = (event: RedshiftGetMetadataEvent): RedshiftFileMetadata => {
  const { fileMetadata } = getRequiredParams(event, 'fileMetadata');
  return JSON.parse(fileMetadata);
};

const getMetadata = (
  configFile: RedshiftConfig,
  dashboardRef: string,
  dataSource: string,
  correlationId: string | undefined,
): string => {
  const dashboard = configFile[dashboardRef];
  const metadata = dashboard?.data_sources[dataSource]?.redshift_metadata;
  if (metadata === null || metadata === undefined) {
    const error = new Error('Metadata was null or undefined');
    logger.error('Could not get metadata from config file', {
      correlationId,
      dashboardRef,
      dataSource,
      error: buildErrorMetadata(error, ERROR_CODES.METADATA_NOT_FOUND),
    });
    throw error;
  }
  return JSON.stringify(metadata);
};
