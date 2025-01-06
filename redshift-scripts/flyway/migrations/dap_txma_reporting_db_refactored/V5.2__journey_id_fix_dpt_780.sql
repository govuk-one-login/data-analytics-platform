DELETE FROM "dap_txma_reporting_db_refactored"."conformed_refactored"."fact_user_journey_event_refactored"
USING "dap_txma_reporting_db_refactored"."conformed_refactored"."dim_event_refactored" AS de
WHERE "fact_user_journey_event_refactored".event_key = de.event_key
  AND de.event_name IN (
      'IPV_HMRC_RECORD_CHECK_CRI_REQUEST_SENT',
      'IPV_HMRC_RECORD_CHECK_CRI_RESPONSE_RECEIVED',
      'IPV_HMRC_RECORD_CHECK_CRI_END',
      'IPV_HMRC_RECORD_CHECK_CRI_VC_ISSUED'
  );

DELETE FROM "dap_txma_reporting_db_refactored"."conformed_refactored"."dim_user_journey_event_refactored"
USING "dap_txma_reporting_db_refactored"."dap_txma_stage"."txma_stage_layer" stg
WHERE dim_user_journey_event_refactored.user_govuk_signin_journey_id = stg.user_govuk_signin_journey_id
  AND stg.event_name IN (
      'IPV_HMRC_RECORD_CHECK_CRI_REQUEST_SENT',
      'IPV_HMRC_RECORD_CHECK_CRI_RESPONSE_RECEIVED',
      'IPV_HMRC_RECORD_CHECK_CRI_END',
      'IPV_HMRC_RECORD_CHECK_CRI_VC_ISSUED'
  );  


/*DELETE FROM "dap_txma_reporting_db_refactored"."conformed_refactored"."event_extensions_refactored"
USING "dap_txma_reporting_db_refactored"."conformed_refactored"."fact_user_journey_event_refactored" AS fct,
      "dap_txma_reporting_db_refactored"."conformed_refactored"."dim_event_refactored" AS de
WHERE "event_extensions_refactored".event_id = fct.event_id
  AND fct.event_key = de.event_key
  AND de.event_name = 'BAV_CRI_VC_ISSUED'
  AND  (event_attribute_name LIKE ('%evidence%cireasons%ci%') 
  OR event_attribute_name LIKE ('%evidence%cireasons%reason%') ) ;*/

UPDATE "dap_txma_reporting_db_refactored"."conformed_refactored"."batch_events_refactored"
SET max_run_date='1999-01-01 00:00:00'
WHERE event_name IN ('IPV_HMRC_RECORD_CHECK_CRI_REQUEST_SENT',
'IPV_HMRC_RECORD_CHECK_CRI_RESPONSE_RECEIVED',
'IPV_HMRC_RECORD_CHECK_CRI_END',
'IPV_HMRC_RECORD_CHECK_CRI_VC_ISSUED');  