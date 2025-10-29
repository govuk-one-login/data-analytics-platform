ALTER TABLE conformed_refactored.fact_user_journey_event_refactored
ALTER DISTKEY user_journey_event_key;


ANALYZE conformed_refactored.fact_user_journey_event_refactored;

update "conformed_refactored".dim_relying_party_refactored
set relying_party_name='Short Term Lets Registration Scheme' ,display_name='DCMS - Short Term Lets Registration Scheme'
,department_name='DCMS',agency_name='DCMS'
where client_id='M6lkFVRxW7ZV9W89QVLMLawidww'