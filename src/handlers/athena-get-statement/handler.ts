import { getRequiredParams, parseS3ResponseAsString } from '../../shared/utils/utils';
import { s3Client } from '../../shared/clients';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import type { RawLayerProcessingEvent } from '../../shared/types/raw-layer-processing';
import { RawLayerProcessingActions } from '../../shared/types/raw-layer-processing';

export const handler = async (event: RawLayerProcessingEvent): Promise<string> => {
  try {
    console.log(`Athena get statement lambda being called with event ${JSON.stringify(event)}`);
    return await handleEvent(validateEvent(event));
  } catch (error) {
    console.error('Error getting athena statement', error);
    throw error;
  }
};

const handleEvent = async (event: Required<RawLayerProcessingEvent>): Promise<string> => {
  const bucket = event.S3MetaDataBucketName;
  const eventName = event.configObject.event_name;
  const productFamily = event.configObject.product_family;
  switch (event.action) {
    case 'GetPartitionQuery': {
      const key = `${event.datasource}/utils/get_query_partition.sql`;
      return await getFileDetails(bucket, key).then(body =>
        body.replaceAll('tablename', productFamily).replaceAll('"event_name"', `"${eventName}"`)
      );
    }
    case 'GetInsertQuery': {
      const key = `${event.datasource}/insert_statements/${eventName}.sql`;
      const partitionValue = extractRowValue(event, 1, 0);
      return await getFileDetails(bucket, key).then(body => body.replaceAll('filter_value', partitionValue));
    }
  }
};

const validateEvent = (event: RawLayerProcessingEvent): Required<RawLayerProcessingEvent> => {
  const { datasource, S3MetaDataBucketName, action, configObject } = getRequiredParams(
    event,
    'datasource',
    'S3MetaDataBucketName',
    'action',
    'configObject'
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
  const request = new GetObjectCommand({
    Bucket: bucket,
    Key: key,
  });
  return await s3Client.send(request).then(async response => await parseS3ResponseAsString(response));
};

const extractRowValue = (event: Required<RawLayerProcessingEvent>, rowNumber: number, dataNumber: number): string => {
  const data = event.configObject.queryResult.ResultSet?.Rows?.at(rowNumber)?.Data?.at(dataNumber);
  if (data === undefined || data.VarCharValue === undefined) {
    throw new Error(`Row number ${rowNumber} or its Data at position ${dataNumber} is missing or invalid`);
  }
  return data.VarCharValue;
};
