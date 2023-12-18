ALTER TABLE  "conformed"."fact_user_journey_event" 
ADD  COLUMN  gpg45_evidences_Strength_Score INTGER NULL;

ALTER TABLE "conformed"."fact_user_journey_event" 
ADD  COLUMN  gpg45_evidence_Validity_Score INTGER NULL;

ALTER TABLE "conformed"."fact_user_journey_event" 
ADD  COLUMN  gpg45_Activity_Score INTGER NULL;

ALTER TABLE "conformed"."fact_user_journey_event" 
ADD  COLUMN  gpg45_Fraud_Score INTGER NULL;

ALTER TABLE "conformed"."fact_user_journey_event" 
ADD  COLUMN  gpg45_Verification_Score INTGER NULL;