import { txmaUnhappyPathEventList } from '../../test-events/txma-consumer-unhappy-path-events/txma-consumer-unhappy-event-list';
import { checkEventLog } from '../../helpers/aws/cloudwatch/check-invalid-event-log';

const setupStartTime = Date.now() - 60 * 60 * 1000; // 60 minutes before test start

describe('TxMA consumer lambda unhappy path tests', () => {
  test.each(txmaUnhappyPathEventList)('$eventType logs "Invalid audit event" in CloudWatch', async ({ auditEvent }) => {
    const logGroupName = `/aws/lambda/${process.env.STACK_NAME}-txma-consumer`;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const eventId = (auditEvent as any).event_id;
    const filterPattern = '"Invalid audit event"';
    // eslint-disable-next-line no-console
    console.log(`Searching for eventId: ${eventId} in log group: ${logGroupName}`);
    const logFound = await checkEventLog(logGroupName, filterPattern, eventId, setupStartTime);
    // eslint-disable-next-line no-console
    console.log(`Log found: ${logFound}`);
    expect(logFound).toBe(true);
  });
});
