ALTER TABLE "conformed"."fact_user_journey_event" 
ADD  COLUMN  DESCRIPTION VARCHAR(1000) default NULL;

ALTER TABLE  "conformed"."fact_user_journey_event" 
ADD  COLUMN  SUCCESSFUL VARCHAR(100) default NULL;


ALTER TABLE "conformed"."fact_user_journey_event" 
ADD  COLUMN  IS_NEW_ACCOUNT VARCHAR(1000) default NULL;

ALTER TABLE "conformed"."fact_user_journey_event" 
ADD  COLUMN  DRIVING_PERMIT VARCHAR(1000) default NULL;

ALTER TABLE "conformed"."fact_user_journey_event" 
ADD  COLUMN  ID_CARD VARCHAR(1000) default NULL;

ALTER TABLE "conformed"."fact_user_journey_event" 
ADD  COLUMN  PASSPORT VARCHAR(1000) default NULL;

ALTER TABLE "conformed"."fact_user_journey_event" 
ADD  COLUMN  RESIDENCE_PERMIT VARCHAR(1000) default NULL;

ALTER TABLE "conformed"."fact_user_journey_event" 
ADD  COLUMN  CLIENT_LANDING_PAGE_URL VARCHAR(1000) default NULL;

ALTER TABLE "conformed"."fact_user_journey_event" 
ADD  COLUMN  CHECK_DETAILS_PHOTO_VERIFICATION_PROCESS_LEVEL VARCHAR(1000) default NULL;

ALTER TABLE "conformed"."fact_user_journey_event" 
ADD  COLUMN  PREVIOUS_GOVUK_SIGNIN_JOURNEY_ID VARCHAR(1000) default NULL;