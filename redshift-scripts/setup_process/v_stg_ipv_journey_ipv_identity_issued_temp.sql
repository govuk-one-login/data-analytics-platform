Create or replace view conformed.v_stg_ipv_journey_ipv_identity_issued_temp
AS
select DISTINCT 
Auth.product_family,
Auth.event_id,
Auth.client_id,
Auth.component_id,
Auth.user_govuk_signin_journey_id,
Auth.user_user_id,
Auth.timestamp,
Auth.timestamp_formatted,
null extensions_clientname,
Auth.processed_date,
Auth.event_name,
1 EVENT_COUNT,
extensions_hasmitigations HAS_mitigations,
extensions_levelofconfidence LEVEL_OF_CONFIDENCE,
extensions_cifail CI_FAIL,
Null REJECTION_REASON,
Null REASON,
Null NOTIFICATION_TYPE,
Null MFA_TYPE,
Null ACCOUNT_RECOVERY,
Null FAILED_CHECK_DETAILS_BIOMETRIC_VERIFICATION_PROCESS_LEVEL,
Null CHECK_DETAILS_BIOMETRIC_VERIFICATION_PROCESS_LEVEL,
Null ADDRESSES_ENTERED,
Null ACTIVITY_HISTORY_SCORE,
Null IDENTITY_FRAUD_SCORE,
Null DECISION_SCORE,
Null FAILED_CHECK_DETAILS_KBV_RESPONSE_MODE,
Null FAILED_CHECK_DETAILS_CHECK_METHOD,
Null CHECK_DETAILS_KBV_RESPONSE_MODEL,
Null CHECK_DETAILS_KBV_QUALITY,
Null VERIFICATION_SCORE,
Null CHECK_DETAILS_CHECK_METHOD,
Null Iss,
Null VALIDITY_SCORE,
Null "TYPE",
BatC.product_family batch_product_family,
BatC.maxrundate,
ref.product_family ref_product_family,
ref.domain,
ref.sub_domain,
ref.other_sub_domain from 
( select * from 
    (SELECT
           'ipv_journey' Product_family 
            ,row_number() over (partition by event_id,timestamp_formatted order by cast (day as integer) desc) as row_num,*
    FROM
     "dev_txma_stage"."ipv_journey"
     WHERE lower(event_name) in ('ipv_identity_issued')
    ) 
    where  row_num=1  
    ) Auth
    join conformed.BatchControl BatC
    On Auth.Product_family=BatC.Product_family
    and to_date(processed_date,'YYYYMMDD')  >  '19990101'
    join conformed.REF_EVENTS ref
    on Auth.EVENT_NAME=ref.event_name
    with no schema binding;
