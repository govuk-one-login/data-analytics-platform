DELETE FROM "conformed_refactored"."event_extensions_refactored"
USING "conformed_refactored"."fact_user_journey_event_refactored" AS fct,
      "conformed_refactored"."dim_event_refactored" AS de
WHERE "event_extensions_refactored".event_id = fct.event_id
  AND fct.event_key = de.event_key
  AND de.event_name = 'BAV_CRI_VC_ISSUED'
  AND  (event_attribute_name LIKE ('%evidence%cireasons%ci%') 
  OR event_attribute_name LIKE ('%evidence%cireasons%reason%') ) ;
