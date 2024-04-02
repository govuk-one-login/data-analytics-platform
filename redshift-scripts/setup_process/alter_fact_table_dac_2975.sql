ALTER TABLE  "conformed"."fact_user_journey_event" 
ADD  COLUMN  user_session_id varchar(1000); 

ALTER TABLE  "conformed"."fact_user_journey_event" 
ADD  COLUMN  extensions_notify_reference varchar(1000); 

ALTER TABLE  "conformed"."fact_user_journey_event" 
ADD  COLUMN  extensions_zendesk_ticket_number varchar(1000); 

ALTER TABLE  "conformed"."fact_user_journey_event" 
ADD  COLUMN  suspicious_activities_client_id varchar(1000); 

ALTER TABLE  "conformed"."fact_user_journey_event" 
ADD  COLUMN  suspicious_activities_session_id varchar(1000); 

ALTER TABLE  "conformed"."fact_user_journey_event" 
ADD  COLUMN  suspicious_activities_event_id varchar(1000); 

ALTER TABLE  "conformed"."fact_user_journey_event" 
ADD  COLUMN  suspicious_activities_event_type varchar(1000); 

ALTER TABLE  "conformed"."fact_user_journey_event" 
ADD  COLUMN  suspicious_activities_timestamp bigint; 
