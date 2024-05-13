DELETE FROM conformed_refactored.fact_user_journey_event_refactored 
WHERE user_journey_event_key IN 
(SELECT
    DISTINCT fct.user_journey_event_key
FROM
     "conformed_refactored"."event_extensions_refactored" ext 
     JOIN conformed_refactored.fact_user_journey_event_refactored fct
     ON ext.event_id=fct.event_id
     JOIN conformed_refactored.dim_event_refactored de
     ON fct.event_key=de.event_key
WHERE event_name ='AUTH_PHONE_CHECK_COMPLETE'
);   


DELETE FROM conformed_refactored.fact_user_journey_event_refactored 
WHERE event_id IN (
SELECT
    DISTINCT stg.event_id
FROM
     dap_txma_stage.txma_stage_layer stg
     JOIN  "dap_txma_stage"."txma_stage_layer_key_values" tt
     ON stg.event_id=tt.event_id
WHERE stg.processed_dt >= 20240508  
);         



DELETE FROM "conformed_refactored"."event_extensions_refactored" 
WHERE user_journey_event_key IN 
(SELECT
    DISTINCT fct.user_journey_event_key
FROM
     "conformed_refactored"."event_extensions_refactored" ext 
     JOIN conformed_refactored.fact_user_journey_event_refactored fct
     ON ext.event_id=fct.event_id
     JOIN conformed_refactored.dim_event_refactored de
     ON fct.event_key=de.event_key
WHERE event_name ='AUTH_PHONE_CHECK_COMPLETE'
);     

DELETE FROM "conformed_refactored"."event_extensions_refactored"  
WHERE event_id IN (
SELECT
    DISTINCT stg.event_id
FROM
     dap_txma_stage.txma_stage_layer stg
     JOIN  "dap_txma_stage"."txma_stage_layer_key_values" tt
     ON stg.event_id=tt.event_id
WHERE stg.processed_dt >= 20240508 
);         
