import { PutObjectCommand } from '@aws-sdk/client-s3';
import { s3Client } from '../../shared/clients';
import { getLogger } from '../../shared/powertools';
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import type { CloudFormationCustomResourceEvent, CloudFormationCustomResourceResponse } from 'aws-lambda';

const logger = getLogger('lambda/copy-raw-to-stage-code');

const ASSETS_DIR = join(process.env.LAMBDA_TASK_ROOT ?? import.meta.dirname, 'assets');

export const handler = async (event: CloudFormationCustomResourceEvent): Promise<void> => {
  logger.info('Received event', { requestType: event.RequestType });

  let status: 'SUCCESS' | 'FAILED' = 'SUCCESS';
  let reason = '';

  try {
    if (event.RequestType === 'Delete') {
      logger.info('Delete request - no action required');
    } else {
      await copyAssetsToBucket();
    }
  } catch (error) {
    status = 'FAILED';
    reason = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Error processing custom resource event', { error });
  }

  await sendResponse(event, status, reason);
};

const copyAssetsToBucket = async (): Promise<void> => {
  const bucket = process.env.DESTINATION_BUCKET;
  const prefix = process.env.DESTINATION_PREFIX ?? 'txma/raw_to_stage/';

  if (!bucket) {
    throw new Error('DESTINATION_BUCKET environment variable is not set');
  }

  const files = readdirSync(ASSETS_DIR);
  logger.info('Copying assets to S3', { bucket, prefix, fileCount: files.length });

  for (const file of files) {
    const filePath = join(ASSETS_DIR, file);
    const body = readFileSync(filePath);
    const key = `${prefix}${file}`;

    await s3Client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: body,
      }),
    );

    logger.info('Uploaded file', { key });
  }
};

const sendResponse = async (
  event: CloudFormationCustomResourceEvent,
  status: 'SUCCESS' | 'FAILED',
  reason: string,
): Promise<void> => {
  const responseBody: CloudFormationCustomResourceResponse = {
    Status: status,
    Reason: reason || 'See CloudWatch logs',
    PhysicalResourceId: event.LogicalResourceId,
    StackId: event.StackId,
    RequestId: event.RequestId,
    LogicalResourceId: event.LogicalResourceId,
  };

  await fetch(event.ResponseURL, {
    method: 'PUT',
    headers: { 'Content-Type': '' },
    body: JSON.stringify(responseBody),
  });
};
