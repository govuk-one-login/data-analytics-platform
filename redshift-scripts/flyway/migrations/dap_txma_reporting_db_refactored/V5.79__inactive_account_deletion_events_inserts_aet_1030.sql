-- Insert HOME_ACCOUNT_TRACKER_ACCOUNT_DELETION_REQUESTED if it doesn't exist
INSERT INTO conformed_refactored.batch_events_refactored (event_name, insert_timestamp, max_run_date)
SELECT 'HOME_ACCOUNT_TRACKER_ACCOUNT_DELETION_REQUESTED', sysdate, '1999-01-01'
WHERE NOT EXISTS (
    SELECT 1
    FROM conformed_refactored.batch_events_refactored
    WHERE event_name = 'HOME_ACCOUNT_TRACKER_ACCOUNT_DELETION_REQUESTED'
);


-- Insert HOME_ACCOUNT_TRACKER_ACCOUNT_FIRST_PERIOD_ENTERED if it doesn't exist
INSERT INTO conformed_refactored.batch_events_refactored (event_name, insert_timestamp, max_run_date)
SELECT 'HOME_ACCOUNT_TRACKER_ACCOUNT_FIRST_PERIOD_ENTERED', sysdate, '1999-01-01'
WHERE NOT EXISTS (
    SELECT 1
    FROM conformed_refactored.batch_events_refactored
    WHERE event_name = 'HOME_ACCOUNT_TRACKER_ACCOUNT_FIRST_PERIOD_ENTERED'
);

-- Insert HOME_ACCOUNT_TRACKER_ACCOUNT_REACTIVATED if it doesn't exist
INSERT INTO conformed_refactored.batch_events_refactored (event_name, insert_timestamp, max_run_date)
SELECT 'HOME_ACCOUNT_TRACKER_ACCOUNT_REACTIVATED', sysdate, '1999-01-01'
WHERE NOT EXISTS (
    SELECT 1
    FROM conformed_refactored.batch_events_refactored
    WHERE event_name = 'HOME_ACCOUNT_TRACKER_ACCOUNT_REACTIVATED'
);

-- Insert HOME_ACCOUNT_TRACKER_ACCOUNT_SECOND_PERIOD_ENTERED if it doesn't exist
INSERT INTO conformed_refactored.batch_events_refactored (event_name, insert_timestamp, max_run_date)
SELECT 'HOME_ACCOUNT_TRACKER_ACCOUNT_SECOND_PERIOD_ENTERED', sysdate, '1999-01-01'
WHERE NOT EXISTS (
    SELECT 1
    FROM conformed_refactored.batch_events_refactored
    WHERE event_name = 'HOME_ACCOUNT_TRACKER_ACCOUNT_SECOND_PERIOD_ENTERED'
);


-- Insert HOME_ACCOUNT_TRACKER_NOTIFICATION_DELIVERY_PERMANENTLY_FAILED if it doesn't exist
INSERT INTO conformed_refactored.batch_events_refactored (event_name, insert_timestamp, max_run_date)
SELECT 'HOME_ACCOUNT_TRACKER_NOTIFICATION_DELIVERY_PERMANENTLY_FAILED', sysdate, '1999-01-01'
WHERE NOT EXISTS (
    SELECT 1
    FROM conformed_refactored.batch_events_refactored
    WHERE event_name = 'HOME_ACCOUNT_TRACKER_NOTIFICATION_DELIVERY_PERMANENTLY_FAILED'
);

-- Insert HOME_ACCOUNT_TRACKER_NOTIFICATION_REQUESTED if it doesn't exist
INSERT INTO conformed_refactored.batch_events_refactored (event_name, insert_timestamp, max_run_date)
SELECT 'HOME_ACCOUNT_TRACKER_NOTIFICATION_REQUESTED', sysdate, '1999-01-01'
WHERE NOT EXISTS (
    SELECT 1
    FROM conformed_refactored.batch_events_refactored
    WHERE event_name = 'HOME_ACCOUNT_TRACKER_NOTIFICATION_REQUESTED'
);

-- Insert HOME_ACCOUNT_TRACKER_NOTIFICATION_SKIPPED if it doesn't exist
INSERT INTO conformed_refactored.batch_events_refactored (event_name, insert_timestamp, max_run_date)
SELECT 'HOME_ACCOUNT_TRACKER_NOTIFICATION_SKIPPED', sysdate, '1999-01-01'
WHERE NOT EXISTS (
    SELECT 1
    FROM conformed_refactored.batch_events_refactored
    WHERE event_name = 'HOME_ACCOUNT_TRACKER_NOTIFICATION_SKIPPED'
);

-- Insert HOME_ACCOUNT_TRACKER_RECORD_DELETED if it doesn't exist
INSERT INTO conformed_refactored.batch_events_refactored (event_name, insert_timestamp, max_run_date)
SELECT 'HOME_ACCOUNT_TRACKER_RECORD_DELETED', sysdate, '1999-01-01'
WHERE NOT EXISTS (
    SELECT 1
    FROM conformed_refactored.batch_events_refactored
    WHERE event_name = 'HOME_ACCOUNT_TRACKER_RECORD_DELETED'
);




