-- Insert AMC_PASSKEY_ENROLMENT_FAILED if it doesn't exist
INSERT INTO conformed_refactored.batch_events_refactored (event_name, insert_timestamp, max_run_date)
SELECT 'AMC_PASSKEY_ENROLMENT_FAILED', sysdate, '1999-01-01'
WHERE NOT EXISTS (
    SELECT 1
    FROM conformed_refactored.batch_events_refactored
    WHERE event_name = 'AMC_PASSKEY_ENROLMENT_FAILED'
);


-- Insert AMC_PASSKEY_ENROLMENT_SUCCESSFUL if it doesn't exist
INSERT INTO conformed_refactored.batch_events_refactored (event_name, insert_timestamp, max_run_date)
SELECT 'AMC_PASSKEY_ENROLMENT_SUCCESSFUL', sysdate, '1999-01-01'
WHERE NOT EXISTS (
    SELECT 1
    FROM conformed_refactored.batch_events_refactored
    WHERE event_name = 'AMC_PASSKEY_ENROLMENT_SUCCESSFUL'
);


-- Insert AMC_PASSKEY_REGISTRATION_FAILED if it doesn't exist
INSERT INTO conformed_refactored.batch_events_refactored (event_name, insert_timestamp, max_run_date)
SELECT 'AMC_PASSKEY_REGISTRATION_FAILED', sysdate, '1999-01-01'
WHERE NOT EXISTS (
    SELECT 1
    FROM conformed_refactored.batch_events_refactored
    WHERE event_name = 'AMC_PASSKEY_REGISTRATION_FAILED'
);

-- Insert AMC_PASSKEY_REGISTRATION_GENERATED if it doesn't exist
INSERT INTO conformed_refactored.batch_events_refactored (event_name, insert_timestamp, max_run_date)
SELECT 'AMC_PASSKEY_REGISTRATION_GENERATED', sysdate, '1999-01-01'
WHERE NOT EXISTS (
    SELECT 1
    FROM conformed_refactored.batch_events_refactored
    WHERE event_name = 'AMC_PASSKEY_REGISTRATION_GENERATED'
);

-- Insert AMC_PASSKEY_REGISTRATION_SUCCESSFUL if it doesn't exist
INSERT INTO conformed_refactored.batch_events_refactored (event_name, insert_timestamp, max_run_date)
SELECT 'AMC_PASSKEY_REGISTRATION_SUCCESSFUL', sysdate, '1999-01-01'
WHERE NOT EXISTS (
    SELECT 1
    FROM conformed_refactored.batch_events_refactored
    WHERE event_name = 'AMC_PASSKEY_REGISTRATION_SUCCESSFUL'
);

-- Insert AUTH_PASSKEY_VERIFICATION_FAILED if it doesn't exist
INSERT INTO conformed_refactored.batch_events_refactored (event_name, insert_timestamp, max_run_date)
SELECT 'AUTH_PASSKEY_VERIFICATION_FAILED', sysdate, '1999-01-01'
WHERE NOT EXISTS (
    SELECT 1
    FROM conformed_refactored.batch_events_refactored
    WHERE event_name = 'AUTH_PASSKEY_VERIFICATION_FAILED'
);


-- Insert AUTH_PASSKEY_VERIFICATION_SUCCESSFUL if it doesn't exist
INSERT INTO conformed_refactored.batch_events_refactored (event_name, insert_timestamp, max_run_date)
SELECT 'AUTH_PASSKEY_VERIFICATION_SUCCESSFUL', sysdate, '1999-01-01'
WHERE NOT EXISTS (
    SELECT 1
    FROM conformed_refactored.batch_events_refactored
    WHERE event_name = 'AUTH_PASSKEY_VERIFICATION_SUCCESSFUL'
);


-- Insert AUTH_PASSKEY_AUTHENTICATION_FAILED if it doesn't exist
INSERT INTO conformed_refactored.batch_events_refactored (event_name, insert_timestamp, max_run_date)
SELECT 'AUTH_PASSKEY_AUTHENTICATION_FAILED', sysdate, '1999-01-01'
WHERE NOT EXISTS (
    SELECT 1
    FROM conformed_refactored.batch_events_refactored
    WHERE event_name = 'AUTH_PASSKEY_AUTHENTICATION_FAILED'
);

-- Insert AUTH_PASSKEY_AUTHENTICATION_GENERATED if it doesn't exist
INSERT INTO conformed_refactored.batch_events_refactored (event_name, insert_timestamp, max_run_date)
SELECT 'AUTH_PASSKEY_AUTHENTICATION_GENERATED', sysdate, '1999-01-01'
WHERE NOT EXISTS (
    SELECT 1
    FROM conformed_refactored.batch_events_refactored
    WHERE event_name = 'AUTH_PASSKEY_AUTHENTICATION_GENERATED'
);

-- Insert AUTH_PASSKEY_AUTHENTICATION_SUCCESSFUL if it doesn't exist
INSERT INTO conformed_refactored.batch_events_refactored (event_name, insert_timestamp, max_run_date)
SELECT 'AUTH_PASSKEY_AUTHENTICATION_SUCCESSFUL', sysdate, '1999-01-01'
WHERE NOT EXISTS (
    SELECT 1
    FROM conformed_refactored.batch_events_refactored
    WHERE event_name = 'AUTH_PASSKEY_AUTHENTICATION_SUCCESSFUL'
);

-- Insert AUTH_PASSKEY_DELETE_SUCCESSFUL if it doesn't exist
INSERT INTO conformed_refactored.batch_events_refactored (event_name, insert_timestamp, max_run_date)
SELECT 'AUTH_PASSKEY_DELETE_SUCCESSFUL', sysdate, '1999-01-01'
WHERE NOT EXISTS (
    SELECT 1
    FROM conformed_refactored.batch_events_refactored
    WHERE event_name = 'AUTH_PASSKEY_DELETE_SUCCESSFUL'
);


-- Insert AUTH_PASSKEY_DELETE_FAILED if it doesn't exist
INSERT INTO conformed_refactored.batch_events_refactored (event_name, insert_timestamp, max_run_date)
SELECT 'AUTH_PASSKEY_DELETE_FAILED', sysdate, '1999-01-01'
WHERE NOT EXISTS (
    SELECT 1
    FROM conformed_refactored.batch_events_refactored
    WHERE event_name = 'AUTH_PASSKEY_DELETE_FAILED'
);


-- Insert HOME_PASSKEY_DELETE_SUCCESSFUL if it doesn't exist
INSERT INTO conformed_refactored.batch_events_refactored (event_name, insert_timestamp, max_run_date)
SELECT 'HOME_PASSKEY_DELETE_SUCCESSFUL', sysdate, '1999-01-01'
WHERE NOT EXISTS (
    SELECT 1
    FROM conformed_refactored.batch_events_refactored
    WHERE event_name = 'HOME_PASSKEY_DELETE_SUCCESSFUL'
);


-- Insert HOME_PASSKEY_DELETE_FAILED if it doesn't exist
INSERT INTO conformed_refactored.batch_events_refactored (event_name, insert_timestamp, max_run_date)
SELECT 'HOME_PASSKEY_DELETE_FAILED', sysdate, '1999-01-01'
WHERE NOT EXISTS (
    SELECT 1
    FROM conformed_refactored.batch_events_refactored
    WHERE event_name = 'HOME_PASSKEY_DELETE_FAILED'
);