import type { Context, APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { getLogger } from '../../shared/powertools';
import { getEnvironmentVariable } from '../../shared/utils/utils';
import { sqsClient, stepFunctionsClient } from '../../shared/clients';
import { SendMessageCommand } from '@aws-sdk/client-sqs';
import { StartExecutionCommand } from '@aws-sdk/client-sfn';

const logger = getLogger('lambda/event-replay');

interface ReplayRequest {
  eventIds: string[];
  replayReason: string;
  requestedBy: string;
  forceReprocess?: boolean;
}

export const handler = async (event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> => {
  logger.addContext(context);
  
  try {
    const request: ReplayRequest = JSON.parse(event.body || '{}');
    
    if (!request.eventIds?.length) {
      return { statusCode: 400, body: JSON.stringify({ error: 'eventIds required' }) };
    }

    const results = await replayEvents(request);
    
    return {
      statusCode: 200,
      body: JSON.stringify({ 
        message: 'Event replay initiated',
        results,
        timestamp: new Date().toISOString()
      })
    };
  } catch (error) {
    logger.error('Event replay failed', { error });
    return { statusCode: 500, body: JSON.stringify({ error: 'Internal server error' }) };
  }
};

const replayEvents = async (request: ReplayRequest) => {
  // 1. Request events from TxMA
  const txmaResponse = await requestEventsFromTxMA(request.eventIds);
  
  // 2. Send events to SQS for reprocessing
  const sqsResults = await sendEventsToSQS(txmaResponse.events, request);
  
  // 3. Optionally trigger immediate ETL processing
  if (request.forceReprocess) {
    await triggerETLProcessing();
  }
  
  return {
    requestedFromTxMA: txmaResponse.success,
    sentToSQS: sqsResults.success,
    triggeredETL: request.forceReprocess,
    eventIds: request.eventIds
  };
};

const requestEventsFromTxMA = async (eventIds: string[]) => {
  // Mock TxMA API call - replace with actual TxMA integration
  logger.info('Requesting events from TxMA', { eventIds });
  
  // In reality, this would call TxMA's replay API
  const mockEvents = eventIds.map(id => ({
    event_id: id,
    timestamp: new Date().toISOString(),
    event_name: 'REPLAYED_EVENT',
    component_id: 'TXMA_REPLAY',
    // ... other event fields
  }));
  
  return {
    success: true,
    events: mockEvents
  };
};

const sendEventsToSQS = async (events: any[], request: ReplayRequest) => {
  const queueUrl = getEnvironmentVariable('TXMA_QUEUE_URL');
  
  for (const event of events) {
    // Add replay metadata
    const replayEvent = {
      ...event,
      replay_metadata: {
        is_replay: true,
        original_event_id: event.event_id,
        replay_reason: request.replayReason,
        requested_by: request.requestedBy,
        replay_timestamp: new Date().toISOString()
      }
    };
    
    await sqsClient.send(new SendMessageCommand({
      QueueUrl: queueUrl,
      MessageBody: JSON.stringify(replayEvent),
      MessageAttributes: {
        'event_type': {
          DataType: 'String',
          StringValue: 'replay'
        }
      }
    }));
  }
  
  return { success: true };
};

const triggerETLProcessing = async () => {
  const stateMachineArn = getEnvironmentVariable('ETL_STATE_MACHINE_ARN');
  
  await stepFunctionsClient.send(new StartExecutionCommand({
    stateMachineArn,
    input: JSON.stringify({
      trigger: 'manual_replay',
      timestamp: new Date().toISOString()
    })
  }));
};