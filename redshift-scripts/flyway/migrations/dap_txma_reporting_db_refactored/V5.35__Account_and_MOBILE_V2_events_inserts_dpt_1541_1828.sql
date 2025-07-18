-- Insert AUTH_ACCOUNT_MANAGEMENT_AUTHENTICATE_INTERVENTION_FAILURE if it doesn't exist
INSERT INTO conformed_refactored.batch_events_refactored (event_name, insert_timestamp, max_run_date)
SELECT 'AUTH_ACCOUNT_MANAGEMENT_AUTHENTICATE_INTERVENTION_FAILURE', sysdate, '1999-01-01'
WHERE NOT EXISTS (
    SELECT 1
    FROM conformed_refactored.batch_events_refactored
    WHERE event_name = 'AUTH_ACCOUNT_MANAGEMENT_AUTHENTICATE_INTERVENTION_FAILURE'
);

-- Insert DCMAW_ASYNC_CRI_APP_START if it doesn't exist
INSERT INTO conformed_refactored.batch_events_refactored (event_name, insert_timestamp, max_run_date)
SELECT 'DCMAW_ASYNC_CRI_APP_START', sysdate, '1999-01-01'
WHERE NOT EXISTS (
    SELECT 1
    FROM conformed_refactored.batch_events_refactored
    WHERE event_name = 'DCMAW_ASYNC_CRI_APP_START'
);
