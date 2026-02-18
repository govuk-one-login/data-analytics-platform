-- Insert IPV_EXPIRED_DCMAW_DL_VC_FOUND if it doesn't exist
INSERT INTO conformed_refactored.batch_events_refactored (event_name, insert_timestamp, max_run_date)
SELECT 'IPV_EXPIRED_DCMAW_DL_VC_FOUND', sysdate, '1999-01-01'
WHERE NOT EXISTS (
    SELECT 1
    FROM conformed_refactored.batch_events_refactored
    WHERE event_name = 'IPV_EXPIRED_DCMAW_DL_VC_FOUND'
);


-- Insert IPV_EXPIRED_FRAUD_VC_FOUND if it doesn't exist
INSERT INTO conformed_refactored.batch_events_refactored (event_name, insert_timestamp, max_run_date)
SELECT 'IPV_EXPIRED_FRAUD_VC_FOUND', sysdate, '1999-01-01'
WHERE NOT EXISTS (
    SELECT 1
    FROM conformed_refactored.batch_events_refactored
    WHERE event_name = 'IPV_EXPIRED_FRAUD_VC_FOUND'
);

