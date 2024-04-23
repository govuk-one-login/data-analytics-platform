ALTER TABLE  "conformed"."fact_user_journey_event" 
ADD  COLUMN  extensions_experian_Iiq_Response_outcome varchar(1000); 

ALTER TABLE  "conformed"."fact_user_journey_event" 
ADD  COLUMN  extensions_experian_Iiq_Response_totalQuestionsAsked integer; 

ALTER TABLE  "conformed"."fact_user_journey_event" 
ADD  COLUMN  extensions_experian_Iiq_Response_totalQuestionsAnsweredCorrect integer; 

ALTER TABLE  "conformed"."fact_user_journey_event" 
ADD  COLUMN  extensions_experian_Iiq_Response_totalQuestionsAnsweredIncorrect integer; 
