-- Insert AUTH_OIDC_TOKEN_GENERATED if it doesn't exist
INSERT INTO conformed_refactored.batch_events_refactored (event_name, insert_timestamp, max_run_date)
SELECT 'AUTH_OIDC_TOKEN_GENERATED', sysdate, '1999-01-01'
WHERE NOT EXISTS (
    SELECT 1
    FROM conformed_refactored.batch_events_refactored
    WHERE event_name = 'AUTH_OIDC_TOKEN_GENERATED'
);
