CREATE TABLE conformed_refactored.event_extensions_refactored_bkp_installation_id
AS
SELECT *
FROM conformed_refactored.event_extensions_refactored; 


DELETE FROM conformed_refactored.event_extensions_refactored
USING conformed_refactored.fact_user_journey_event_refactored fct,
      conformed_refactored.dim_event_refactored de
WHERE conformed_refactored.event_extensions_refactored.event_id = fct.event_id
  AND fct.event_key = de.event_key
  AND de.event_name IN (
      'WALLET_CREDENTIAL_ADDED',
      'WALLET_CREDENTIAL_ADD_ATTEMPT'
  )
  AND conformed_refactored.event_extensions_refactored.event_attribute_name = 'installation_id';


