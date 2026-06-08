-- Insert AMC_STARTED if it doesn't exist
INSERT INTO conformed_refactored.batch_events_refactored (event_name, insert_timestamp, max_run_date)
SELECT 'AMC_STARTED', sysdate, '1999-01-01'
WHERE NOT EXISTS (
    SELECT 1
    FROM conformed_refactored.batch_events_refactored
    WHERE event_name = 'AMC_STARTED'
);

-- Insert AMC_ACTION_STARTED if it doesn't exist
INSERT INTO conformed_refactored.batch_events_refactored (event_name, insert_timestamp, max_run_date)
SELECT 'AMC_ACTION_STARTED', sysdate, '1999-01-01'
WHERE NOT EXISTS (
    SELECT 1
    FROM conformed_refactored.batch_events_refactored
    WHERE event_name = 'AMC_ACTION_STARTED'
);

-- Insert AMC_ACTION_COMPLETED if it doesn't exist
INSERT INTO conformed_refactored.batch_events_refactored (event_name, insert_timestamp, max_run_date)
SELECT 'AMC_ACTION_COMPLETED', sysdate, '1999-01-01'
WHERE NOT EXISTS (
    SELECT 1
    FROM conformed_refactored.batch_events_refactored
    WHERE event_name = 'AMC_ACTION_COMPLETED'
);

-- Insert AMC_COMPLETED if it doesn't exist
INSERT INTO conformed_refactored.batch_events_refactored (event_name, insert_timestamp, max_run_date)
SELECT 'AMC_COMPLETED', sysdate, '1999-01-01'
WHERE NOT EXISTS (
    SELECT 1
    FROM conformed_refactored.batch_events_refactored
    WHERE event_name = 'AMC_COMPLETED'
);

-- Insert HOME_ACTION_STARTED if it doesn't exist
INSERT INTO conformed_refactored.batch_events_refactored (event_name, insert_timestamp, max_run_date)
SELECT 'HOME_ACTION_STARTED', sysdate, '1999-01-01'
WHERE NOT EXISTS (
    SELECT 1
    FROM conformed_refactored.batch_events_refactored
    WHERE event_name = 'HOME_ACTION_STARTED'
);


-- Insert HOME_ACTION_COMPLETED if it doesn't exist
INSERT INTO conformed_refactored.batch_events_refactored (event_name, insert_timestamp, max_run_date)
SELECT 'HOME_ACTION_COMPLETED', sysdate, '1999-01-01'
WHERE NOT EXISTS (
    SELECT 1
    FROM conformed_refactored.batch_events_refactored
    WHERE event_name = 'HOME_ACTION_COMPLETED'
);


-- Insert AUTH_CHECK_USER_KNOWN_EMAIL if it doesn't exist
INSERT INTO conformed_refactored.batch_events_refactored (event_name, insert_timestamp, max_run_date)
SELECT 'AUTH_CHECK_USER_KNOWN_EMAIL', sysdate, '1999-01-01'
WHERE NOT EXISTS (
    SELECT 1
    FROM conformed_refactored.batch_events_refactored
    WHERE event_name = 'AUTH_CHECK_USER_KNOWN_EMAIL'
);

-- Insert AUTH_AMC_AUTHORISATION_RECEIVED if it doesn't exist
INSERT INTO conformed_refactored.batch_events_refactored (event_name, insert_timestamp, max_run_date)
SELECT 'AUTH_AMC_AUTHORISATION_RECEIVED', sysdate, '1999-01-01'
WHERE NOT EXISTS (
    SELECT 1
    FROM conformed_refactored.batch_events_refactored
    WHERE event_name = 'AUTH_AMC_AUTHORISATION_RECEIVED'
);


-- Insert AUTH_AMC_AUTHORISATION_ERROR_RECEIVED if it doesn't exist
INSERT INTO conformed_refactored.batch_events_refactored (event_name, insert_timestamp, max_run_date)
SELECT 'AUTH_AMC_AUTHORISATION_ERROR_RECEIVED', sysdate, '1999-01-01'
WHERE NOT EXISTS (
    SELECT 1
    FROM conformed_refactored.batch_events_refactored
    WHERE event_name = 'AUTH_AMC_AUTHORISATION_ERROR_RECEIVED'
);


-- Insert AUTH_AMC_AUTHORISATION_REQUESTED if it doesn't exist
INSERT INTO conformed_refactored.batch_events_refactored (event_name, insert_timestamp, max_run_date)
SELECT 'AUTH_AMC_AUTHORISATION_REQUESTED', sysdate, '1999-01-01'
WHERE NOT EXISTS (
    SELECT 1
    FROM conformed_refactored.batch_events_refactored
    WHERE event_name = 'AUTH_AMC_AUTHORISATION_REQUESTED'
);


-- Insert HOME_AMC_AUTHORISATION_RECEIVED if it doesn't exist
INSERT INTO conformed_refactored.batch_events_refactored (event_name, insert_timestamp, max_run_date)
SELECT 'HOME_AMC_AUTHORISATION_RECEIVED', sysdate, '1999-01-01'
WHERE NOT EXISTS (
    SELECT 1
    FROM conformed_refactored.batch_events_refactored
    WHERE event_name = 'HOME_AMC_AUTHORISATION_RECEIVED'
);

-- Insert HOME_AMC_AUTHORISATION_ERROR_RECEIVED if it doesn't exist
INSERT INTO conformed_refactored.batch_events_refactored (event_name, insert_timestamp, max_run_date)
SELECT 'HOME_AMC_AUTHORISATION_ERROR_RECEIVED', sysdate, '1999-01-01'
WHERE NOT EXISTS (
    SELECT 1
    FROM conformed_refactored.batch_events_refactored
    WHERE event_name = 'HOME_AMC_AUTHORISATION_ERROR_RECEIVED'
);

-- Insert HOME_AMC_AUTHORISATION_REQUESTED if it doesn't exist
INSERT INTO conformed_refactored.batch_events_refactored (event_name, insert_timestamp, max_run_date)
SELECT 'HOME_AMC_AUTHORISATION_REQUESTED', sysdate, '1999-01-01'
WHERE NOT EXISTS (
    SELECT 1
    FROM conformed_refactored.batch_events_refactored
    WHERE event_name = 'HOME_AMC_AUTHORISATION_REQUESTED'
);


-- Insert AUTH_PASSKEY_REGISTRATION_PROMPT_SKIPPED if it doesn't exist
INSERT INTO conformed_refactored.batch_events_refactored (event_name, insert_timestamp, max_run_date)
SELECT 'AUTH_PASSKEY_REGISTRATION_PROMPT_SKIPPED', sysdate, '1999-01-01'
WHERE NOT EXISTS (
    SELECT 1
    FROM conformed_refactored.batch_events_refactored
    WHERE event_name = 'AUTH_PASSKEY_REGISTRATION_PROMPT_SKIPPED'
);
