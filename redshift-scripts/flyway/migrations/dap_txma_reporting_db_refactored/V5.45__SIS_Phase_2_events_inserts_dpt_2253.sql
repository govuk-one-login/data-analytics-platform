-- Insert IPV_STORED_IDENTITY_CHECKED if it doesn't exist
INSERT INTO conformed_refactored.batch_events_refactored (event_name, insert_timestamp, max_run_date)
SELECT 'IPV_STORED_IDENTITY_CHECKED', sysdate, '1999-01-01'
WHERE NOT EXISTS (
    SELECT 1
    FROM conformed_refactored.batch_events_refactored
    WHERE event_name = 'IPV_STORED_IDENTITY_CHECKED'
);

-- Insert SIS_STORED_IDENTITY_READ if it doesn't exist
INSERT INTO conformed_refactored.batch_events_refactored (event_name, insert_timestamp, max_run_date)
SELECT 'SIS_STORED_IDENTITY_READ', sysdate, '1999-01-01'
WHERE NOT EXISTS (
    SELECT 1
    FROM conformed_refactored.batch_events_refactored
    WHERE event_name = 'SIS_STORED_IDENTITY_READ'
);


-- Insert SIS_STORED_IDENTITY_RETURNED if it doesn't exist
INSERT INTO conformed_refactored.batch_events_refactored (event_name, insert_timestamp, max_run_date)
SELECT 'SIS_STORED_IDENTITY_RETURNED', sysdate, '1999-01-01'
WHERE NOT EXISTS (
    SELECT 1
    FROM conformed_refactored.batch_events_refactored
    WHERE event_name = 'SIS_STORED_IDENTITY_RETURNED'
);
