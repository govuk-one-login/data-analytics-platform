import { getLogger } from '../../../common/powertools';
import { getEnvironmentVariable, getRequiredParams } from '../../../common/utilities/utils';
import type { RedshiftConfig, RedshiftFileMetadata } from '../../../common/types/redshift-metadata';
import { getConfigFile, getFilePathParts } from '../../../common/services/manual-reference-data-ingestion/redshift-metadata';

const logger = getLogger('lambda/redshift-get-metadata');

export interface RedshiftGetMetadataEvent {
  fileMetadata: string;
}

export const handler = async (event: RedshiftGetMetadataEvent): Promise<string> => {
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

const getFileMetadata = (event: RedshiftGetMetadataEvent): RedshiftFileMetadata => {
  const { fileMetadata } = getRequiredParams(event, 'fileMetadata');
  return JSON.parse(fileMetadata);
};

const getMetadata = (configFile: RedshiftConfig, dashboardRef: string, dataSource: string): string => {
  const metadata = configFile[dashboardRef].data_sources[dataSource].redshift_metadata;
  if (metadata === null || metadata === undefined) {
    logger.error('Could not get metadata from config file', { configFile, dashboardRef, dataSource });
    throw new Error('Metadata was null or undefined');
  }
  return JSON.stringify(metadata);
};
