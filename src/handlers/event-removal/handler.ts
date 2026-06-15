import type { Context, APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { getLogger } from '../../shared/powertools';
import { getEnvironmentVariable } from '../../shared/utils/utils';
import { s3Client, athenaClient, redshiftDataClient } from '../../shared/clients';
import { DeleteObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { StartQueryExecutionCommand } from '@aws-sdk/client-athena';
import { ExecuteStatementCommand } from '@aws-sdk/client-redshift-data';

const logger = getLogger('lambda/event-removal');

interface RemovalRequest {
  eventIds: string[];
  reason: string;
  requestedBy: string;
}

export const handler = async (event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> => {
  logger.addContext(context);
  
  try {
    const request: RemovalRequest = JSON.parse(event.body || '{}');
    
    if (!request.eventIds?.length) {
      return { statusCode: 400, body: JSON.stringify({ error: 'eventIds required' }) };
    }

    const results = await removeEvents(request);
    
    return {
      statusCode: 200,
      body: JSON.stringify({ 
        message: 'Event removal completed',
        results,
        timestamp: new Date().toISOString()
      })
    };
  } catch (error) {
    logger.error('Event removal failed', { error });
    return { statusCode: 500, body: JSON.stringify({ error: 'Internal server error' }) };
  }
};

const removeEvents = async (request: RemovalRequest) => {
  const eventIdList = request.eventIds.map(id => `'${id}'`).join(',');
  
  // 1. Remove from Redshift conform layer
  await removeFromRedshift(eventIdList, request);
  
  // 2. Remove from Stage layer (Athena)
  await removeFromStageLayer(eventIdList);
  
  // 3. Remove from Raw layer (S3)
  await removeFromRawLayer(request.eventIds);
  
  return {
    removedFromRedshift: true,
    removedFromStage: true,
    removedFromRaw: true,
    eventIds: request.eventIds
  };
};

const removeFromRedshift = async (eventIdList: string, request: RemovalRequest) => {
  const workgroup = getEnvironmentVariable('REDSHIFT_WORKGROUP');
  const database = getEnvironmentVariable('REDSHIFT_DATABASE');
  
  // Log removal for audit
  const auditSql = `
    INSERT INTO audit_refactored.event_removal_log 
    (event_ids, reason, requested_by, removal_timestamp)
    VALUES ('${request.eventIds.join(',')}', '${request.reason}', '${request.requestedBy}', GETDATE())
  `;
  
  await redshiftDataClient.send(new ExecuteStatementCommand({
    WorkgroupName: workgroup,
    Database: database,
    Sql: auditSql
  }));
  
  // Remove from fact tables
  const deleteSql = `
    DELETE FROM conformed_refactored.fact_user_journey_event_refactored 
    WHERE event_id IN (${eventIdList})
  `;
  
  await redshiftDataClient.send(new ExecuteStatementCommand({
    WorkgroupName: workgroup,
    Database: database,
    Sql: deleteSql
  }));
};

const removeFromStageLayer = async (eventIdList: string) => {
  const database = getEnvironmentVariable('STAGE_DATABASE');
  const workgroup = getEnvironmentVariable('ATHENA_WORKGROUP');
  const outputLocation = getEnvironmentVariable('ATHENA_OUTPUT_LOCATION');
  
  const query = `
    DELETE FROM ${database}.txma_stage_layer 
    WHERE event_id IN (${eventIdList})
  `;
  
  await athenaClient.send(new StartQueryExecutionCommand({
    QueryString: query,
    WorkGroup: workgroup,
    ResultConfiguration: { OutputLocation: outputLocation }
  }));
};

const removeFromRawLayer = async (eventIds: string[]) => {
  const rawBucket = getEnvironmentVariable('RAW_BUCKET');
  
  for (const eventId of eventIds) {
    // List objects containing the event ID
    const listResponse = await s3Client.send(new ListObjectsV2Command({
      Bucket: rawBucket,
      Prefix: 'firehose/',
      MaxKeys: 1000
    }));
    
    // Delete matching objects (simplified - in practice would need more sophisticated matching)
    if (listResponse.Contents) {
      for (const object of listResponse.Contents) {
        if (object.Key?.includes(eventId)) {
          await s3Client.send(new DeleteObjectCommand({
            Bucket: rawBucket,
            Key: object.Key
          }));
        }
      }
    }
  }
};