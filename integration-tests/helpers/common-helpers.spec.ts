import { getErrorFilePrefix, getEventFilePrefix } from './common-helpers';

test('get event file prefix', () => {
  jest.useFakeTimers().setSystemTime(new Date(2023, 5, 1));
  expect(getEventFilePrefix('EVENT_NAME')).toEqual('txma/EVENT_NAME/year=2023/month=06/day=01');

  jest.useFakeTimers().setSystemTime(new Date(2023, 11, 25));
  expect(getEventFilePrefix('EVENT_NAME')).toEqual('txma/EVENT_NAME/year=2023/month=12/day=25');
});

test('get error file prefix', () => {
  jest.useFakeTimers().setSystemTime(new Date(2023, 5, 1));
  expect(getErrorFilePrefix()).toEqual('kinesis-processing-errors-metadata-extraction-failed/2023/06/01');

  jest.useFakeTimers().setSystemTime(new Date(2023, 11, 25));
  expect(getErrorFilePrefix()).toEqual('kinesis-processing-errors-metadata-extraction-failed/2023/12/25');
});
