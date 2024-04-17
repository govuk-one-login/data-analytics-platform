ALTER TABLE  "conformed"."fact_user_journey_event" 
ADD  COLUMN  extensions_evidence_mitigations_code varchar(10000); 

ALTER TABLE  "conformed"."fact_user_journey_event" 
ADD  COLUMN  extensions_evidence_mitigations_mitigatingCredentialIssuer varchar(10000); 