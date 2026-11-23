-- Insert AMC_AIS_RESPONSE_RECEIVED if it doesn't exist
INSERT INTO conformed_refactored.batch_events_refactored (event_name, insert_timestamp, max_run_date)
SELECT 'AMC_AIS_RESPONSE_RECEIVED', sysdate, '1999-01-01'
WHERE NOT EXISTS (
    SELECT 1
    FROM conformed_refactored.batch_events_refactored
    WHERE event_name = 'AMC_AIS_RESPONSE_RECEIVED'
);