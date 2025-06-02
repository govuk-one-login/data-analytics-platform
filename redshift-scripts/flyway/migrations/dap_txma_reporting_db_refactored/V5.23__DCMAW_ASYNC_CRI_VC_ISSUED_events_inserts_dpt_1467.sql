-- Insert DCMAW_ASYNC_CRI_VC_ISSUED if it doesn't exist
INSERT INTO conformed_refactored.batch_events_refactored (event_name, insert_timestamp, max_run_date)
SELECT 'DCMAW_ASYNC_CRI_VC_ISSUED', sysdate, '1999-01-01'
WHERE NOT EXISTS (
    SELECT 1
    FROM conformed_refactored.batch_events_refactored
    WHERE event_name = 'DCMAW_ASYNC_CRI_VC_ISSUED'
);