import { StartCrawlerCommand, UpdateCrawlerCommand } from '@aws-sdk/client-glue';
import { glueClient } from '../../shared/clients';
import { getLoggerAndMetrics } from '../../shared/powertools';

export const { logger, metrics } = getLoggerAndMetrics('lambda/trigger-txma-crawler');

export const handler = async (): Promise<unknown> => {
  const partitionPredicate = getLast5daysPredicate();

  logger.info('triggering the last 5 days', {
    partitionPredicate: partitionPredicate,
  });
  const updateCrawlerCommand = new UpdateCrawlerCommand({
    Name: 'txma_raw_layer_test',
    DatabaseName: 'dev-txma-raw',
    Configuration: JSON.stringify({
      Version: 1.0,
      CrawlerOutput: {
        Partitions: {
          AddOrUpdateBehavior: 'InheritFromTable',
        },
      },
      Grouping: {
        Partitions: [partitionPredicate],
      },
    }),
  });
  try {
    const response = await glueClient.send(updateCrawlerCommand);
    logger.info(`update crawler response ${response}`);
  } catch (error) {
    logger.error(`error updating crawler ${error}`);
  }

  const startCrawlerCommand = new StartCrawlerCommand({
    Name: 'txma_raw_layer_test',
  });

  try {
    const response = await glueClient.send(startCrawlerCommand);
    logger.info(`update crawler response ${response}`);
  } catch (error) {
    logger.error(`error starting crawler ${error}`);
  }
  return {
    status: 200,
    body: 'Triggered Crawler',
  };
};

const getLast5daysPredicate = () => {
  const today = new Date();
  const fiveDaysAgo = new Date();
  fiveDaysAgo.setDate(today.getDate() - 5);

  const yearPredicate = `year BETWEEN ${fiveDaysAgo.getFullYear()} AND ${today.getFullYear()}`;
  const monthPredicate = `month BETWEEN ${fiveDaysAgo.getMonth() + 1} AND ${today.getMonth() + 1}`;
  const dayPredicate = `day BETWEEN ${fiveDaysAgo.getDate()} AND ${today.getDate()}`;

  return `${yearPredicate} AND ${monthPredicate} AND ${dayPredicate}`;
};
