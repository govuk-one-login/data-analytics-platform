import { handler } from './handler';

describe('Lambda Function', () => {
    it('should handle the Cross Account Lambda invocation correctly', async () => {
        const event = {
            config: [
                {
                    event_name: 'example_event',
                    start_date: '2024-01-01',
                    end_date: '2024-01-03',
                }
            ],
            raw_bucket: 'your-raw-bucket-name',
            queue_url: 'your-sqs-queue-url'
        };

        const context = {};

        const result = await handler(event, context);

        expect(result.statusCode).toBe(200);
        expect(result.body).toEqual(JSON.stringify('Messages sent to SQS successfully!'));
    });

    it('should handle error when encountering an invalid event for the cross account lambda', async () => {
        const event = {
            config: [
                {}
            ],
            raw_bucket: 'your-raw-bucket-name',
            queue_url: 'your-sqs-queue-url'
        };

        const context = {};

        const result = await handler(event, context);

        expect(result.statusCode).toBe(500);
        expect(result.body).toEqual(JSON.stringify('Error sending messages to SQS'));
    });
});
