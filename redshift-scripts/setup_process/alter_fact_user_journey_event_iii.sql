ALTER TABLE "conformed"."fact_user_journey_event" 
ADD  COLUMN  CI_FAIL BOOLEAN default NULL;

ALTER TABLE  "conformed"."fact_user_journey_event" 
ADD  COLUMN  HAS_MITIGATIONS BOOLEAN default NULL;


ALTER TABLE "conformed"."fact_user_journey_event" 
ADD  COLUMN  LEVEL_OF_CONFIDENCE VARCHAR(100) default NULL;