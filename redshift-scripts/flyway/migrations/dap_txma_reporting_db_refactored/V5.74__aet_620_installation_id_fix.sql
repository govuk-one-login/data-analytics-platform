CREATE TABLE conformed_refactored.event_extensions_refactored_bkp_installation_id
AS
SELECT *
FROM conformed_refactored.event_extensions_refactored; 


DELETE FROM conformed_refactored.event_extensions_refactored ext
USING conformed_refactored.fact_user_journey_event_refactored fct
JOIN conformed_refactored.dim_event_refactored de
    ON fct.event_key = de.event_key
WHERE ext.event_id = fct.event_id
  AND de.event_name IN (
      'WALLET_CREDENTIAL_ADDED',
      'WALLET_CREDENTIAL_ADD_ATTEMPT'
  )
  AND ext.event_attribute_name = 'installation_id';


