DELETE FROM conformed_refactored.fact_user_journey_event_refactored
USING conformed_refactored.dim_event_refactored de,
      conformed_refactored.dim_date_refactored ddr
WHERE conformed_refactored.fact_user_journey_event_refactored.event_key = de.event_key
  AND conformed_refactored.fact_user_journey_event_refactored.date_key = ddr.date_key
  AND de.event_name = 'IPV_APP_MISSING_CONTEXT'
  AND ddr.date > '2025-06-09';

UPDATE "dap_txma_reporting_db_refactored"."conformed_refactored"."batch_events_refactored"
SET max_run_date='2025-06-09 00:00:00'
WHERE event_name='IPV_APP_MISSING_CONTEXT';    