-- Insert EVCS_IDENTITY_RETURNED if it doesn't exist
INSERT INTO conformed_refactored.batch_events_refactored (event_name, insert_timestamp, max_run_date)
SELECT 'EVCS_IDENTITY_RETURNED', sysdate, '1999-01-01'
WHERE NOT EXISTS (
    SELECT 1
    FROM conformed_refactored.batch_events_refactored
    WHERE event_name = 'EVCS_IDENTITY_RETURNED'
);


-- Insert EVCS_IDENTITY_SAVED if it doesn't exist
INSERT INTO conformed_refactored.batch_events_refactored (event_name, insert_timestamp, max_run_date)
SELECT 'EVCS_IDENTITY_SAVED', sysdate, '1999-01-01'
WHERE NOT EXISTS (
    SELECT 1
    FROM conformed_refactored.batch_events_refactored
    WHERE event_name = 'EVCS_IDENTITY_SAVED'
);


-- Insert EVCS_IDENTITY_REPLACED if it doesn't exist
INSERT INTO conformed_refactored.batch_events_refactored (event_name, insert_timestamp, max_run_date)
SELECT 'EVCS_IDENTITY_REPLACED', sysdate, '1999-01-01'
WHERE NOT EXISTS (
    SELECT 1
    FROM conformed_refactored.batch_events_refactored
    WHERE event_name = 'EVCS_IDENTITY_REPLACED'
);


-- Insert EVCS_IDENTITY_INVALIDATED if it doesn't exist
INSERT INTO conformed_refactored.batch_events_refactored (event_name, insert_timestamp, max_run_date)
SELECT 'EVCS_IDENTITY_INVALIDATED', sysdate, '1999-01-01'
WHERE NOT EXISTS (
    SELECT 1
    FROM conformed_refactored.batch_events_refactored
    WHERE event_name = 'EVCS_IDENTITY_INVALIDATED'
);

-- Insert EVCS_IDENTITY_MARKED_AS_DELETED if it doesn't exist
INSERT INTO conformed_refactored.batch_events_refactored (event_name, insert_timestamp, max_run_date)
SELECT 'EVCS_IDENTITY_MARKED_AS_DELETED', sysdate, '1999-01-01'
WHERE NOT EXISTS (
    SELECT 1
    FROM conformed_refactored.batch_events_refactored
    WHERE event_name = 'EVCS_IDENTITY_MARKED_AS_DELETED'
);

-- Insert SIS_IDENTITY_RECORD_INVALIDATED if it doesn't exist
INSERT INTO conformed_refactored.batch_events_refactored (event_name, insert_timestamp, max_run_date)
SELECT 'SIS_IDENTITY_RECORD_INVALIDATED', sysdate, '1999-01-01'
WHERE NOT EXISTS (
    SELECT 1
    FROM conformed_refactored.batch_events_refactored
    WHERE event_name = 'SIS_IDENTITY_RECORD_INVALIDATED'
);