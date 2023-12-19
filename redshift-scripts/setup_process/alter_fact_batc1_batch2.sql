ALTER TABLE  "conformed"."fact_user_journey_event" 
ADD  COLUMN  gpg45_evidences_Strength_Score INTEGER NULL;

ALTER TABLE "conformed"."fact_user_journey_event" 
ADD  COLUMN  gpg45_evidence_Validity_Score INTEGER NULL;

ALTER TABLE "conformed"."fact_user_journey_event" 
ADD  COLUMN  gpg45_Activity_Score INTEGER NULL;

ALTER TABLE "conformed"."fact_user_journey_event" 
ADD  COLUMN  gpg45_Fraud_Score INTEGER NULL;

ALTER TABLE "conformed"."fact_user_journey_event" 
ADD  COLUMN  gpg45_Verification_Score INTEGER NULL;