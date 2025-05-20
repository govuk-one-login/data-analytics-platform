DELETE FROM "conformed_refactored"."fact_user_journey_event_refactored"
USING conformed_refactored.dim_event_refactored de
WHERE "conformed_refactored"."fact_user_journey_event_refactored".event_key = de.event_key
  AND de.event_name = 'AUTH_LOG_OUT_SUCCESS';