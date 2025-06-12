-- Insert AUTH_MFA_METHOD_ADD_FAILED if it doesn't exist
INSERT INTO conformed_refactored.batch_events_refactored (event_name, insert_timestamp, max_run_date)
SELECT 'AUTH_MFA_METHOD_ADD_FAILED', sysdate, '1999-01-01'
WHERE NOT EXISTS (
    SELECT 1
    FROM conformed_refactored.batch_events_refactored
    WHERE event_name = 'AUTH_MFA_METHOD_ADD_FAILED'
);

-- Insert AUTH_MFA_METHOD_ADD_PROMPTED if it doesn't exist
INSERT INTO conformed_refactored.batch_events_refactored (event_name, insert_timestamp, max_run_date)
SELECT 'AUTH_MFA_METHOD_ADD_PROMPTED', sysdate, '1999-01-01'
WHERE NOT EXISTS (
    SELECT 1
    FROM conformed_refactored.batch_events_refactored
    WHERE event_name = 'AUTH_MFA_METHOD_ADD_PROMPTED'
);

-- Insert AUTH_MFA_METHOD_ADD_SKIPPED if it doesn't exist
INSERT INTO conformed_refactored.batch_events_refactored (event_name, insert_timestamp, max_run_date)
SELECT 'AUTH_MFA_METHOD_ADD_SKIPPED', sysdate, '1999-01-01'
WHERE NOT EXISTS (
    SELECT 1
    FROM conformed_refactored.batch_events_refactored
    WHERE event_name = 'AUTH_MFA_METHOD_ADD_SKIPPED'
);

-- Insert AUTH_MFA_METHOD_ADD_STARTED if it doesn't exist
INSERT INTO conformed_refactored.batch_events_refactored (event_name, insert_timestamp, max_run_date)
SELECT 'AUTH_MFA_METHOD_ADD_STARTED', sysdate, '1999-01-01'
WHERE NOT EXISTS (
    SELECT 1
    FROM conformed_refactored.batch_events_refactored
    WHERE event_name = 'AUTH_MFA_METHOD_ADD_STARTED'
);

-- Insert AUTH_MFA_METHOD_ALTERNATIVE_REQUESTED if it doesn't exist
INSERT INTO conformed_refactored.batch_events_refactored (event_name, insert_timestamp, max_run_date)
SELECT 'AUTH_MFA_METHOD_ALTERNATIVE_REQUESTED', sysdate, '1999-01-01'
WHERE NOT EXISTS (
    SELECT 1
    FROM conformed_refactored.batch_events_refactored
    WHERE event_name = 'AUTH_MFA_METHOD_ALTERNATIVE_REQUESTED'
);

-- Insert AUTH_MFA_METHOD_DELETE_STARTED if it doesn't exist
INSERT INTO conformed_refactored.batch_events_refactored (event_name, insert_timestamp, max_run_date)
SELECT 'AUTH_MFA_METHOD_DELETE_STARTED', sysdate, '1999-01-01'
WHERE NOT EXISTS (
    SELECT 1
    FROM conformed_refactored.batch_events_refactored
    WHERE event_name = 'AUTH_MFA_METHOD_DELETE_STARTED'
);

-- Insert AUTH_MFA_METHOD_SWITCH_FAILED if it doesn't exist
INSERT INTO conformed_refactored.batch_events_refactored (event_name, insert_timestamp, max_run_date)
SELECT 'AUTH_MFA_METHOD_SWITCH_FAILED', sysdate, '1999-01-01'
WHERE NOT EXISTS (
    SELECT 1
    FROM conformed_refactored.batch_events_refactored
    WHERE event_name = 'AUTH_MFA_METHOD_SWITCH_FAILED'
);

-- Insert AUTH_MFA_METHOD_SWITCH_STARTED if it doesn't exist
INSERT INTO conformed_refactored.batch_events_refactored (event_name, insert_timestamp, max_run_date)
SELECT 'AUTH_MFA_METHOD_SWITCH_STARTED', sysdate, '1999-01-01'
WHERE NOT EXISTS (
    SELECT 1
    FROM conformed_refactored.batch_events_refactored
    WHERE event_name = 'AUTH_MFA_METHOD_SWITCH_STARTED'
);