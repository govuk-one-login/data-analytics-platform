import {
  buildErrorMetadata,
  getAWSEnvironment,
  getRequiredParams,
  parseS3ResponseAsString,
} from '../../shared/utils/utils';
import { s3Client } from '../../shared/clients';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import type { AthenaGetStatementEvent } from '../../shared/types/raw-layer-processing';
import { RawLayerProcessingActions } from '../../shared/types/raw-layer-processing';
import { logger, initialiseLogger } from '../../shared/logger';
import { ERROR_CODES } from '../../shared/error-codes';
import type { Context } from 'aws-lambda';

export const handler = async (event: AthenaGetStatementEvent, context?: Context): Promise<string> => {
  if (context !== undefined) {
    initialiseLogger(context);
  }
  const startTime = Date.now();
  const correlationId = context?.awsRequestId;
  logger.info('Athena get statement handler started', {
    correlationId,
    action: event.action,
    datasource: event.datasource,
  });

  try {
    const result = await handleEvent(validateEvent(event));
    logger.info('Athena get statement handler completed', {
      correlationId,
      outcome: 'success',
      duration: Date.now() - startTime,
    });
    return result;
  } catch (error) {
    logger.error('Error getting athena statement', {
      correlationId,
      outcome: 'failure',
      duration: Date.now() - startTime,
      error: buildErrorMetadata(error, ERROR_CODES.GET_STATEMENT_FAILED),
    });
    throw error;
  }
};

const handleEvent = async (event: AthenaGetStatementEvent): Promise<string> => {
  const bucket = event.S3MetaDataBucketName;
  const eventName = event.configObject.event_name;
  const productFamily = event.configObject.product_family;
  switch (event.action) {
    case 'GetPartitionQuery': {
      const key = `${event.datasource}/utils/get_query_partition.sql`;
      return await getFileDetails(bucket, key).then(body =>
        body.replaceAll('tablename', productFamily).replaceAll('"event_name"', `'${eventName?.toUpperCase()}'`),
      );
    }
    case 'GetInsertQuery': {
      const key = `${event.datasource}/insert_statements/${eventName}.sql`;
      const partitionValue = extractRowValue(event, 1, 0);
      return await getFileDetails(bucket, key).then(body => body.replaceAll('filter_value', partitionValue));
    }
  }
};

const validateEvent = (event: AthenaGetStatementEvent): AthenaGetStatementEvent => {
  const { datasource, S3MetaDataBucketName, action, configObject } = getRequiredParams(
    event,
    'datasource',
    'S3MetaDataBucketName',
    'action',
    'configObject',
  );
  if (!RawLayerProcessingActions.includes(action)) {
    throw new Error(`Unknown action "${action}"`);
  }
  const rows = configObject?.queryResult?.ResultSet?.Rows;
  if (action === 'GetInsertQuery') {
    if (rows === null || rows === undefined) {
      throw new Error(`Missing ConfigObject, ResultSet or Rows`);
    }
  }
  return { datasource, S3MetaDataBucketName, action, configObject };
};

const getFileDetails = async (bucket: string, key: string): Promise<string> => {
  const environment = getAWSEnvironment();
  const request = new GetObjectCommand({
    Bucket: bucket,
    Key: key,
  });
  return await s3Client
    .send(request)
    .then(parseS3ResponseAsString)
    .then(response => response.replaceAll('environment', environment));
};

const extractRowValue = (event: AthenaGetStatementEvent, rowNumber: number, dataNumber: number): string => {
  const data = event.configObject.queryResult.ResultSet?.Rows?.at(rowNumber)?.Data?.at(dataNumber);
  if (data?.VarCharValue === undefined) {
    throw new Error(`Row number ${rowNumber} or its Data at position ${dataNumber} is missing or invalid`);
  }
  return data.VarCharValue;
};
