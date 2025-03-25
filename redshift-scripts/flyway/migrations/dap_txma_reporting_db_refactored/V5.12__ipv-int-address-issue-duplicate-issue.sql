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
where event_name='IPV_INTERNATIONAL_ADDRESS_START');


--delete from fact

DELETE FROM "conformed_refactored"."fact_user_journey_event_refactored"
WHERE event_id IN (
    SELECT fct.event_id
    FROM "conformed_refactored"."fact_user_journey_event_refactored" fct
    JOIN "conformed_refactored"."dim_event_refactored" de
    ON fct.event_key = de.event_key
    WHERE de.event_name = 'IPV_INTERNATIONAL_ADDRESS_START'
);


-- delete duplicate entery 
DELETE FROM "conformed_refactored"."batch_events_refactored"
where event_name='IPV_INTERNATIONAL_ADDRESS_START';

--reset the event

insert into conformed_refactored.batch_events_refactored (event_name,insert_timestamp,max_run_date) 
values ('IPV_INTERNATIONAL_ADDRESS_START',sysdate,'1999-01-01');


