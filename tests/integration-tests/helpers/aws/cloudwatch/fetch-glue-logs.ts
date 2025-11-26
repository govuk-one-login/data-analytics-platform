import { CloudWatchLogsClient, FilterLogEventsCommand } from '@aws-sdk/client-cloudwatch-logs';

export const fetchGlueErrorLogs = async (
  logGroupName: string,
  jobRunId: string,
  startTime: number,
): Promise<string> => {
  const client = new CloudWatchLogsClient({});

  const command = new FilterLogEventsCommand({
    logGroupName,
    logStreamNamePrefix: jobRunId,
    filterPattern: 'ERROR',
    startTime,
    endTime: Date.now(),
    limit: 100,
  });

  const response = await client.send(command);
  return response.events?.map(e => e.message).join('\n') || '';
};
