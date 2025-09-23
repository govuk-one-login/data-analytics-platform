import { getEnvironmentVariable, parseS3ResponseAsObject } from '../../utilities/utils';
import { s3Client } from '../../clients';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import type { S3EventRecord } from 'aws-lambda';
import type { RedshiftConfig, RedshiftDatasource } from '../../types/redshift-metadata';
import type { Logger } from '@aws-lambda-powertools/logger';

export const getDatasource = async (record: S3EventRecord, logger: Logger): Promise<RedshiftDatasource> => {
  const key = record.s3.object.key;
  const filePathParts = getFilePathParts(key);
  logger.info('Extracted file path parts for record', { filePathParts });

  const configFileBucket = getEnvironmentVariable('METADATA_BUCKET_NAME');
  const configFile = await getConfigFile(configFileBucket, filePathParts.configRef);
  logger.info('Retrieved config file', { configFile });
  return configFile[filePathParts.dashboardRef].data_sources[filePathParts.dataSource];
};

export const getFilePathParts = (filePath: string): { configRef: string; dashboardRef: string; dataSource: string } => {
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

export const getConfigFile = async (bucket: string, configRef: string): Promise<RedshiftConfig> => {
  const response = await s3Client.send(
    new GetObjectCommand({
      Bucket: bucket,
      Key: `reference_data/configuration_files/${configRef}_reference_data_configuration.json`,
    }),
  );
  return await parseS3ResponseAsObject(response);
};
