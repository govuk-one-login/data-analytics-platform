--As these scripts takes too long to run you need to run them manually. This will also run a dummy
--sql insert so flayway keeps a track of this change.

select * from "conformed_refactored"."batch_events_refactored";

/*--Take backup first
create table "conformed_refactored"."fact_user_journey_event_refactored_bkp_ipv_duplicate_issue"
AS
select * from "conformed_refactored"."fact_user_journey_event_refactored";

create table "conformed_refactored"."event_extensions_refactored_bkp_ipv_duplicate_issue"
AS
select * from "conformed_refactored"."event_extensions_refactored";

create table "conformed_refactored"."batch_events_refactored_bkp_ipv_duplicate_issue"
AS
select * from "conformed_refactored"."batch_events_refactored";


--delete from fact

WITH duplicates AS (
    SELECT fct.user_journey_event_key
    FROM "conformed_refactored"."fact_user_journey_event_refactored" fct
    JOIN "conformed_refactored"."dim_event_refactored" de
        ON fct.event_key = de.event_key
    WHERE de.event_name = 'IPV_INTERNATIONAL_ADDRESS_START'
    --AND fct.event_id = 'e77e2b91-530d-416b-a93f-ac02b2610548'
    QUALIFY ROW_NUMBER() OVER (PARTITION BY fct.event_id ORDER BY fct.created_date DESC) = 2
)
DELETE FROM "conformed_refactored"."fact_user_journey_event_refactored"
WHERE user_journey_event_key IN (SELECT user_journey_event_key FROM duplicates);

--delete from extensions 

WITH fact_filtered AS (
    -- Select relevant fact records by joining with dim_event_refactored on event_name
    SELECT f.user_journey_event_key, f.event_id
    FROM "conformed_refactored"."fact_user_journey_event_refactored" f
    JOIN "conformed_refactored"."dim_event_refactored" d
        ON f.event_key = d.event_key
    WHERE d.event_name = 'IPV_INTERNATIONAL_ADDRESS_START'
)
DELETE FROM "conformed_refactored"."event_extensions_refactored"
WHERE event_id IN (SELECT event_id FROM fact_filtered)  -- Match event_id
AND user_journey_event_key NOT IN (SELECT user_journey_event_key FROM fact_filtered);

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
*/