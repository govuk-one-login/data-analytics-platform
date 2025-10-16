--take a backup manually first

--create table conformed_refactored.fact_user_journey_event_refactored_back_up_auth_password_reset_requested
--as select * from conformed_refactored.fact_user_journey_event_refactored;

DELETE FROM conformed_refactored.fact_user_journey_event_refactored
WHERE user_journey_event_key IN (
    SELECT fct.user_journey_event_key
    FROM conformed_refactored.fact_user_journey_event_refactored fct
    JOIN "dap_txma_reporting_db_refactored"."conformed_refactored".dim_event_refactored de
        ON fct.event_key = de.event_key
    WHERE de.event_name = 'AUTH_PASSWORD_RESET_REQUESTED'
);