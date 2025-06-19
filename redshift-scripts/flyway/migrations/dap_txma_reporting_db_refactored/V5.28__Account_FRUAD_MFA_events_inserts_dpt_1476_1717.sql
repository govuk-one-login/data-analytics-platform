-- Insert AUTH_EMAIL_FRAUD_CHECK_DECISION_USED if it doesn't exist
INSERT INTO conformed_refactored.batch_events_refactored (event_name, insert_timestamp, max_run_date)
SELECT 'AUTH_EMAIL_FRAUD_CHECK_DECISION_USED', sysdate, '1999-01-01'
WHERE NOT EXISTS (
    SELECT 1
    FROM conformed_refactored.batch_events_refactored
    WHERE event_name = 'AUTH_EMAIL_FRAUD_CHECK_DECISION_USED'
);

-- Insert AUTH_EMAIL_FRAUD_CHECK_DECISION_MADE if it doesn't exist
INSERT INTO conformed_refactored.batch_events_refactored (event_name, insert_timestamp, max_run_date)
SELECT 'AUTH_EMAIL_FRAUD_CHECK_DECISION_MADE', sysdate, '1999-01-01'
WHERE NOT EXISTS (
    SELECT 1
    FROM conformed_refactored.batch_events_refactored
    WHERE event_name = 'AUTH_EMAIL_FRAUD_CHECK_DECISION_MADE'
);

-- Insert AUTH_EMAIL_FRAUD_CHECK_REQUESTED if it doesn't exist
INSERT INTO conformed_refactored.batch_events_refactored (event_name, insert_timestamp, max_run_date)
SELECT 'AUTH_EMAIL_FRAUD_CHECK_REQUESTED', sysdate, '1999-01-01'
WHERE NOT EXISTS (
    SELECT 1
    FROM conformed_refactored.batch_events_refactored
    WHERE event_name = 'AUTH_EMAIL_FRAUD_CHECK_REQUESTED'
);

-- Insert AUTH_EMAIL_FRAUD_CHECK_BYPASSED if it doesn't exist
INSERT INTO conformed_refactored.batch_events_refactored (event_name, insert_timestamp, max_run_date)
SELECT 'AUTH_EMAIL_FRAUD_CHECK_BYPASSED', sysdate, '1999-01-01'
WHERE NOT EXISTS (
    SELECT 1
    FROM conformed_refactored.batch_events_refactored
    WHERE event_name = 'AUTH_EMAIL_FRAUD_CHECK_BYPASSED'
);

-- Insert AUTH_EMAIL_FRAUD_CHECK_RESPONSE_RECEIVED if it doesn't exist
INSERT INTO conformed_refactored.batch_events_refactored (event_name, insert_timestamp, max_run_date)
SELECT 'AUTH_EMAIL_FRAUD_CHECK_RESPONSE_RECEIVED', sysdate, '1999-01-01'
WHERE NOT EXISTS (
    SELECT 1
    FROM conformed_refactored.batch_events_refactored
    WHERE event_name = 'AUTH_EMAIL_FRAUD_CHECK_RESPONSE_RECEIVED'
);

-- Insert AUTH_MFA_METHOD_MIGRATION_ATTEMPTED if it doesn't exist
INSERT INTO conformed_refactored.batch_events_refactored (event_name, insert_timestamp, max_run_date)
SELECT 'AUTH_MFA_METHOD_MIGRATION_ATTEMPTED', sysdate, '1999-01-01'
WHERE NOT EXISTS (
    SELECT 1
    FROM conformed_refactored.batch_events_refactored
    WHERE event_name = 'AUTH_MFA_METHOD_MIGRATION_ATTEMPTED'
);

