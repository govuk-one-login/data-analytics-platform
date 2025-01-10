import { StartCrawlerCommand, UpdateCrawlerCommand } from '@aws-sdk/client-glue';
import { glueClient } from '../../shared/clients';
import { getLoggerAndMetrics } from '../../shared/powertools';

export const { logger, metrics } = getLoggerAndMetrics('lambda/trigger-txma-crawler');

export const handler = async (): Promise<unknown> => {
  const paths = getLast5DaysPaths();

  logger.info('triggering the last 5 days of AUTH_LOG_IN_SUCCESS', {
    paths: paths,
  });
  const updateCrawlerCommand = new UpdateCrawlerCommand({
    Name: 'txma_raw_layer_test',
    Targets: {
      S3Targets: paths.map(path => ({
        Path: path,
      })),
    },
    Configuration: JSON.stringify({
      Version: 1.0,
      CrawlerOutput: {
        Partitions: {
          AddOrUpdateBehavior: 'InheritFromTable',
        },
        TableLevelConfiguration: [
          {
            DatabaseName: 'dev-txma-raw',
            TableName: 'txma-poc',
            Path: 's3://dev-txma-raw/txma/',
          },
        ],
      },
    }),
    TablePrefix: ''
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

const getLast5DaysPaths = () => {
  const today = new Date();
  const paths: string[] = [];
  for (let index = 0; index < 5; index++) {
    const date = new Date();
    date.setDate(today.getDate() - index);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    paths.push(`s3://dev-dap-raw-layer/txma/AUTH_LOG_IN_SUCCESS/year=${year}/month=${month}/day=${day}/`);
  }

  return paths;
};
