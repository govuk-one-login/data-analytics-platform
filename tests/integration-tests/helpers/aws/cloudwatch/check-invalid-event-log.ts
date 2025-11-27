import { CloudWatchLogsClient, FilterLogEventsCommand } from '@aws-sdk/client-cloudwatch-logs';

export const checkEventLog = async (
  logGroupName: string,
  filterPattern: string,
  eventId: string,
  startTime: number,
): Promise<boolean> => {
  const client = new CloudWatchLogsClient({});

  const command = new FilterLogEventsCommand({
    logGroupName,
    filterPattern: `${filterPattern} "${eventId}"`,
    startTime,
    endTime: Date.now(),
  });

  const response = await client.send(command);
  return (response.events?.length ?? 0) > 0;
};
