DELETE FROM conformed_refactored.fact_user_journey_event_refactored 
WHERE event_id IN (
SELECT
    DISTINCT stg.event_id
FROM
     dap_txma_stage.txma_stage_layer stg
     JOIN  "dap_txma_stage"."txma_stage_layer_key_values" tt
     ON stg.event_id=tt.event_id
WHERE stg.processed_dt >= 20240509 
);         


DELETE FROM "conformed_refactored"."event_extensions_refactored"  
WHERE event_id IN (
SELECT
    DISTINCT stg.event_id
FROM
     dap_txma_stage.txma_stage_layer stg
     JOIN  "dap_txma_stage"."txma_stage_layer_key_values" tt
     ON stg.event_id=tt.event_id
WHERE stg.processed_dt >= 20240509 
);         
