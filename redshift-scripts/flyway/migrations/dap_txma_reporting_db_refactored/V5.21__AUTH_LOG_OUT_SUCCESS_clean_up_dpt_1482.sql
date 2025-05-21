DELETE FROM "conformed_refactored"."fact_user_journey_event_refactored"
USING conformed_refactored.dim_event_refactored de
WHERE "conformed_refactored"."fact_user_journey_event_refactored".event_key = de.event_key
AND de.event_name = 'AUTH_LOG_OUT_SUCCESS';

UPDATE "dap_txma_reporting_db_refactored"."conformed_refactored"."batch_events_refactored"
SET max_run_date='1990-01-01 00:00:00'
WHERE event_name='AUTH_LOG_OUT_SUCCESS';  