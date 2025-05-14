-- Insert AUTH_MFA_METHOD_ADD_COMPLETED if it doesn't exist
INSERT INTO conformed_refactored.batch_events_refactored (event_name, insert_timestamp, max_run_date)
SELECT 'AUTH_MFA_METHOD_ADD_COMPLETED', sysdate, '1999-01-01'
WHERE NOT EXISTS (
    SELECT 1
    FROM conformed_refactored.batch_events_refactored
    WHERE event_name = 'AUTH_MFA_METHOD_ADD_COMPLETED'
);

-- Insert AUTH_MFA_METHOD_SWITCH_COMPLETED if it doesn't exist
INSERT INTO conformed_refactored.batch_events_refactored (event_name, insert_timestamp, max_run_date)
SELECT 'AUTH_MFA_METHOD_SWITCH_COMPLETED', sysdate, '1999-01-01'
WHERE NOT EXISTS (
    SELECT 1
    FROM conformed_refactored.batch_events_refactored
    WHERE event_name = 'AUTH_MFA_METHOD_SWITCH_COMPLETED'
);

-- Insert AUTH_MFA_METHOD_DELETE_COMPLETED if it doesn't exist
INSERT INTO conformed_refactored.batch_events_refactored (event_name, insert_timestamp, max_run_date)
SELECT 'AUTH_MFA_METHOD_DELETE_COMPLETED', sysdate, '1999-01-01'
WHERE NOT EXISTS (
    SELECT 1
    FROM conformed_refactored.batch_events_refactored
    WHERE event_name = 'AUTH_MFA_METHOD_DELETE_COMPLETED'
);