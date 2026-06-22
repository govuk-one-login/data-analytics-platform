-- Insert HOME_PASSKEY_DELETE_REQUESTED if it doesn't exist
INSERT INTO conformed_refactored.batch_events_refactored (event_name, insert_timestamp, max_run_date)
SELECT 'HOME_PASSKEY_DELETE_REQUESTED', sysdate, '1999-01-01'
WHERE NOT EXISTS (
    SELECT 1
    FROM conformed_refactored.batch_events_refactored
    WHERE event_name = 'HOME_PASSKEY_DELETE_REQUESTED'
);