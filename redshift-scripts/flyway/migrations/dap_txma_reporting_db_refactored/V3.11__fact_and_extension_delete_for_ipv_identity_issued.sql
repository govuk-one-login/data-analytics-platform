delete from "conformed_refactored"."fact_user_journey_event_refactored"
where event_id in (
SELECT
    event_id
FROM
    "conformed_refactored"."fact_user_journey_event_refactored" fct  
join conformed_refactored.dim_event_refactored de
on fct.event_key=de.event_key
where de.event_name='IPV_IDENTITY_ISSUED'  
) ;

delete from "conformed_refactored"."event_extensions_refactored"
where event_id in (
SELECT
    event_id
FROM
    "conformed_refactored"."fact_user_journey_event_refactored" fct  
join conformed_refactored.dim_event_refactored de
on fct.event_key=de.event_key
where de.event_name='IPV_IDENTITY_ISSUED'  
) ;