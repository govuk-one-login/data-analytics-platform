
--delete from fact

DELETE FROM "conformed_refactored"."fact_user_journey_event_refactored"
WHERE event_id IN (
    SELECT fct.event_id
    FROM "conformed_refactored"."fact_user_journey_event_refactored" fct
    JOIN "conformed_refactored"."dim_event_refactored" de
    ON fct.event_key = de.event_key
    WHERE de.event_name = 'IPV_INTERNATIONAL_ADDRESS_START'
);

--delete from extensions table

DELETE FROM "conformed_refactored"."event_extensions_refactored"
WHERE event_id IN (SELECT
   distinct ext.event_id
FROM
"conformed_refactored"."fact_user_journey_event_refactored" fct
join conformed_refactored.event_extensions_refactored ext
on fct.event_id=ext.event_id
join conformed_refactored.dim_event_refactored de
on fct.event_key=de.event_key
where event_name='IPV_INTERNATIONAL_ADDRESS_START')


-- delete duplicate entery 
WITH ranked_events AS (
    SELECT event_name, 
           insert_timestamp,
           ROW_NUMBER() OVER (
               PARTITION BY event_name 
               ORDER BY insert_timestamp DESC
           ) AS row_num
    FROM "conformed_refactored"."batch_events_refactored"
    WHERE event_name = 'IPV_INTERNATIONAL_ADDRESS_START'
)
DELETE FROM "conformed_refactored"."batch_events_refactored"
WHERE (event_name, insert_timestamp) IN (
    SELECT event_name, insert_timestamp
    FROM ranked_events
    WHERE row_num = 1
);


--reset the batch start date to ingest clean data.
update "conformed_refactored"."batch_events_refactored"
set max_run_date='1999-01-01'
where event_name='IPV_INTERNATIONAL_ADDRESS_START';