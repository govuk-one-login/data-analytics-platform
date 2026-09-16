import { PutObjectCommand } from '@aws-sdk/client-s3';
import { s3Client } from '../../shared/clients';
import { logger } from '../../shared/logger';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import type { CloudFormationCustomResourceEvent, CloudFormationCustomResourceResponse } from 'aws-lambda';
import { ERROR_CODES } from './error-codes';

const ASSETS_DIR = join(process.env.LAMBDA_TASK_ROOT ?? import.meta.dirname, 'assets');

export const handler = async (event: CloudFormationCustomResourceEvent): Promise<void> => {
  const startTime = Date.now();

  logger.info('Custom resource handler started', {
    requestType: event.RequestType,
    stackId: event.StackId,
    logicalResourceId: event.LogicalResourceId,
  });

  let status: 'SUCCESS' | 'FAILED' = 'SUCCESS';
  let reason = '';

  try {
    if (event.RequestType === 'Delete') {
      logger.info('Delete request - no action required');
    } else {
      await copyAssetsToBucket();
    }

    logger.info('Custom resource handler completed', {
      requestType: event.RequestType,
      outcome: 'success',
      duration: Date.now() - startTime,
    });
  } catch (error) {
    status = 'FAILED';
    reason = error instanceof Error ? error.message : 'Unknown error';

    logger.error('Custom resource handler failed', {
      outcome: 'failure',
      duration: Date.now() - startTime,
      error: {
        code: ERROR_CODES.CUSTOM_RESOURCE_FAILED,
        message: error instanceof Error ? error.message : 'Unknown error',
        name: error instanceof Error ? error.name : 'UnknownError',
        stack: error instanceof Error ? error.stack : undefined,
      },
    });
  }

  await sendResponse(event, status, reason);
};

const copyAssetsToBucket = async (): Promise<void> => {
  const bucket = process.env.DESTINATION_BUCKET;
  const prefix = process.env.DESTINATION_PREFIX ?? 'txma/raw_to_stage/';

  if (!bucket) {
    const error = new Error('DESTINATION_BUCKET environment variable is not set');
    logger.error('Missing required environment variable', {
      error: {
        code: ERROR_CODES.MISSING_DESTINATION_BUCKET,
        message: error.message,
        name: error.name,
      },
    });
    throw error;
  }

  const files = readdirSync(ASSETS_DIR);

  logger.info('Copying assets to S3', { bucket, prefix, fileCount: files.length });

  for (const file of files) {
    const filePath = join(ASSETS_DIR, file);
    const body = readFileSync(filePath);
    const key = `${prefix}${file}`;

    try {
      await s3Client.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: key,
          Body: body,
        }),
      );
      logger.info('Asset uploaded successfully', { key });
    } catch (error) {
      logger.error('Failed to upload asset to S3', {
        error: {
          code: ERROR_CODES.S3_UPLOAD_FAILED,
          message: error instanceof Error ? error.message : 'Unknown error',
          name: error instanceof Error ? error.name : 'UnknownError',
          stack: error instanceof Error ? error.stack : undefined,
        },
        key,
      });
      throw error;
    }
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
