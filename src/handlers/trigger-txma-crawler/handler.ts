import { StartCrawlerCommand, UpdateCrawlerCommand } from '@aws-sdk/client-glue';
import { glueClient } from '../../shared/clients';
import { getLoggerAndMetrics } from '../../shared/powertools';

export const { logger, metrics } = getLoggerAndMetrics('lambda/trigger-txma-crawler');

export const handler = async (): Promise<unknown> => {
  const updateCrawlerCommand = new UpdateCrawlerCommand({
    Name: 'some-crawler-name',
    Targets: {
      S3Targets: [{ Path: 'somePath' }],
    },
  });
  await glueClient.send(updateCrawlerCommand);

  const startCrawlerCommand = new StartCrawlerCommand({
    Name: 'some-crawler-name',
  });

  await glueClient.send(startCrawlerCommand);
  return null;
};
