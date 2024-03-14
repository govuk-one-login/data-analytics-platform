ALTER TABLE  "conformed"."fact_user_journey_event" 
ADD  COLUMN  event_timestamp_ms BIGINT; 

ALTER TABLE  "conformed"."fact_user_journey_event" 
ADD  COLUMN  event_timestamp_ms_formatted varchar(1000); 

ALTER TABLE  "conformed"."fact_user_journey_event" 
ADD  COLUMN  mitigation_type varchar(1000); 