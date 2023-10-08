CREATE OR REPLACE PROCEDURE conformed.sp_conformed_stage_view_data_objects_beyond_mvp() 
AS $$ 
BEGIN 

Create or replace view conformed.v_stg_ipv_cri_fraud_beyond_mvp_one_time
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
Null REJECTION_REASON,
Null REASON,
Null NOTIFICATION_TYPE,
Null MFA_TYPE,
Null ACCOUNT_RECOVERY,
failedcheckdetails_biometricverificationprocesslevel FAILED_CHECK_DETAILS_BIOMETRIC_VERIFICATION_PROCESS_LEVEL,
checkdetails_biometricverificationprocesslevel CHECK_DETAILS_BIOMETRIC_VERIFICATION_PROCESS_LEVEL,
strengthscore strength_score,
Null ADDRESSES_ENTERED,
activityhistoryscore ACTIVITY_HISTORY_SCORE,
identityfraudscore IDENTITY_FRAUD_SCORE,
decisionscore DECISION_SCORE,
Null FAILED_CHECK_DETAILS_KBV_RESPONSE_MODE,
failedcheckdetails_checkmethod FAILED_CHECK_DETAILS_CHECK_METHOD,
Null CHECK_DETAILS_KBV_RESPONSE_MODEL,
Null CHECK_DETAILS_KBV_QUALITY,
Null VERIFICATION_SCORE,
checkdetails_checkmethod CHECK_DETAILS_CHECK_METHOD,
iss Iss,
validityscore VALIDITY_SCORE,
type "TYPE",
BatC.product_family batch_product_family,
BatC.maxrundate,
ref.product_family ref_product_family,
ref.domain,
ref.sub_domain,
ref.other_sub_domain from 
( select * from 
    (SELECT
           'ipv_cri_fraud' Product_family 
            ,row_number() over (partition by event_id,timestamp_formatted order by cast (day as integer) desc) as row_num
            ,*
    FROM
                (with base_data as
            (SELECT
                event_id,
                event_name,
                client_id,
                component_id,
                "timestamp",
                timestamp_formatted,
                user_govuk_signin_journey_id,
                user_user_id,
                year,
                month,
                day,
                iss,
                processed_date,
                extensions_evidence,
                null AS activityhistoryscore,
                nvl2(valid_json_data,valid_json_data.checkdetails,valid_json_data) AS checkdetails,
                nvl2(valid_json_data,valid_json_data.failedcheckdetails,valid_json_data) AS failedcheckdetails,
                nvl2(valid_json_data,valid_json_data.decisionscore,valid_json_data) AS decisionscore,
                nvl2(valid_json_data,valid_json_data.identityfraudscore,valid_json_data) AS identityfraudscore,
                null as strengthscore,
                nvl2(valid_json_data,valid_json_data.type,valid_json_data) AS type,
                null AS validityscore    
                FROM (
                    SELECT
                        event_id,
                        event_name,
                        client_id,
                        component_id,
                        "timestamp",
                        timestamp_formatted,
                        user_govuk_signin_journey_id,
                        user_user_id,
                        year,
                        month,
                        day,
                        processed_date,
                        extensions_evidence,
                        extensions_iss as iss,
                        case extensions_evidence != ''
                        and is_valid_json_array(extensions_evidence)
                        when true then json_parse(
                            json_extract_array_element_text(extensions_evidence, 0)
                        )
                        else null end as valid_json_data
                    FROM
                        "dap_txma_stage"."ipv_cri_fraud"
                        where event_name in ('IPV_FRAUD_CRI_REQUEST_SENT','IPV_FRAUD_CRI_RESPONSE_RECEIVED','IPV_FRAUD_CRI_THIRD_PARTY_REQUEST_ENDED')
                        --and event_id='f6eb0bef-98dc-4a71-ac33-d6bc1725f11d'
                )), level_1_data as
            (SELECT
                        event_id,
                        event_name,
                        client_id,
                        component_id,
                        "timestamp",
                        timestamp_formatted,
                        user_govuk_signin_journey_id,
                        user_user_id,
                        year,
                        month,
                        day,
                        iss,
                        processed_date,
                        activityhistoryscore,
                        strengthscore,
                        identityfraudscore ,
                        decisionscore ,
                        json_serialize(checkdetails) checkdetails_final,
                        json_serialize(failedcheckdetails) failedcheckdetails_final,
                        type,
                        validityscore
                    FROM
                        base_data
                        where json_serialize(failedcheckdetails) != ''
            ),level_2_data as
            (select 
                    event_id,
                    event_name,
                    client_id,
                    component_id,
                    "timestamp",
                    timestamp_formatted,
                    user_govuk_signin_journey_id,
                    user_user_id,
                    year,
                    month,
                    day,
                    iss,
                    processed_date,
                    activityhistoryscore,
                    strengthscore,
                    identityfraudscore ,
                    decisionscore ,
                    type,
                    validityscore,
                    case failedcheckdetails_final != ''
                        and is_valid_json_array(failedcheckdetails_final)
                        when true then json_parse(
                            json_extract_array_element_text(failedcheckdetails_final, 0)
                        )
                    else null end as valid_json_failedcheckdetails_data,
                    case checkdetails_final != ''
                        and is_valid_json_array(checkdetails_final)
                        when true then json_parse(
                            json_extract_array_element_text(checkdetails_final, 0)
                        )
                    else null end as valid_json_checkdetails_data  
            from level_1_data
            )
            select 
                event_id,
                event_name,
                client_id,
                component_id,
                "timestamp",
                timestamp_formatted,
                user_govuk_signin_journey_id,
                user_user_id,
                year,
                month,
                day,
                iss,
                processed_date,
                activityhistoryscore,
                strengthscore,
                identityfraudscore ,
                decisionscore ,
                type,
                validityscore,
                nvl2(valid_json_failedcheckdetails_data,valid_json_failedcheckdetails_data.checkmethod,valid_json_failedcheckdetails_data) AS failedcheckdetails_checkmethod,
                nvl2(valid_json_failedcheckdetails_data,valid_json_failedcheckdetails_data.biometricverificationprocesslevel,valid_json_failedcheckdetails_data) AS        
                failedcheckdetails_biometricverificationprocesslevel,
                nvl2(valid_json_checkdetails_data,valid_json_checkdetails_data.checkmethod,valid_json_checkdetails_data) AS checkdetails_checkmethod,
                nvl2(valid_json_checkdetails_data,valid_json_checkdetails_data.biometricverificationprocesslevel,valid_json_checkdetails_data) AS      
                checkdetails_biometricverificationprocesslevel
            from  level_2_data 
    ) 
    )
    where  row_num=1  
    ) Auth
    join conformed.BatchControl BatC
    On Auth.Product_family=BatC.Product_family
    and to_date(processed_date,'YYYYMMDD')   > '19990101'
    join conformed.REF_EVENTS ref
    on Auth.EVENT_NAME=ref.event_name
   with no schema binding;



Create or replace view conformed.v_stg_ipv_cri_address_beyond_mvp_one_time
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
Null REJECTION_REASON,
Null REASON,
Null NOTIFICATION_TYPE,
Null MFA_TYPE,
Null ACCOUNT_RECOVERY,
Null FAILED_CHECK_DETAILS_BIOMETRIC_VERIFICATION_PROCESS_LEVEL,
Null CHECK_DETAILS_BIOMETRIC_VERIFICATION_PROCESS_LEVEL,
extensions_addressesentered ADDRESSES_ENTERED,
Null ACTIVITY_HISTORY_SCORE,
Null IDENTITY_FRAUD_SCORE,
Null DECISION_SCORE,
Null FAILED_CHECK_DETAILS_KBV_RESPONSE_MODE,
Null FAILED_CHECK_DETAILS_CHECK_METHOD,
Null CHECK_DETAILS_KBV_RESPONSE_MODEL,
Null CHECK_DETAILS_KBV_QUALITY,
Null VERIFICATION_SCORE,
Null CHECK_DETAILS_CHECK_METHOD,
extensions_iss Iss,
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
           'ipv_cri_address' Product_family 
            ,row_number() over (partition by event_id,timestamp_formatted order by cast (day as integer) desc) as row_num,*
    FROM
     "dap_txma_stage"."ipv_cri_address"
    WHERE event_name in ('IPV_ADDRESS_CRI_END','IPV_ADDRESS_CRI_REQUEST_SENT')
    ) 
    where  row_num=1  
    ) Auth
    join conformed.BatchControl BatC
    On Auth.Product_family=BatC.Product_family
    and to_date(processed_date,'YYYYMMDD')  >  '19990101'
    join conformed.REF_EVENTS ref
    on Auth.EVENT_NAME=ref.event_name
    with no schema binding;


Create or replace view conformed.v_stg_auth_orchestration_beyond_mvp_one_time
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
Auth.extensions_clientname,
Auth.processed_date,
Auth.event_name,
1 EVENT_COUNT,
extensions_description description,
extensions_clientlandingpageurl client_landing_page_url,
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
           'auth_orchestration'Product_family 
            ,row_number() over (partition by event_id,timestamp_formatted order by cast (day as integer) desc) as row_num,*
    FROM
     "dap_txma_stage"."auth_orchestration"
    WHERE event_name in ('AUTH_AUTHORISATION_REQUEST_ERROR','AUTH_AUTHORISATION_REQUEST_RECEIVED','AUTH_IPV_AUTHORISATION_REQUESTED') 
    ) 
    where  row_num=1  
    ) Auth
    join conformed.BatchControl BatC
    On Auth.Product_family=BatC.Product_family
    and to_date(processed_date,'YYYYMMDD')  > '19990101'
    join conformed.REF_EVENTS ref
    on Auth.EVENT_NAME=ref.event_name 
    with no schema binding;



Create or replace view conformed.v_stg_auth_account_user_login_beyond_mvp_one_time
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
extensions_isnewaccount is_new_account, 
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
           'auth_account_user_login' Product_family 
            ,row_number() over (partition by event_id,timestamp_formatted order by cast (day as integer) desc) as row_num,*
    FROM
     "dap_txma_stage"."auth_account_user_login"
     WHERE event_name in ('AUTH_AUTH_CODE_ISSUED')
     ) 
    where  row_num=1  
    ) Auth
    join conformed.BatchControl BatC
    On Auth.Product_family=BatC.Product_family
    and to_date(processed_date,'YYYYMMDD')   > '19990101'
    join conformed.REF_EVENTS ref
    on Auth.EVENT_NAME=ref.event_name
    with no schema binding;


Create or replace view conformed.v_stg_ipv_cri_cic
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
           'ipv_cri_cic' Product_family 
            ,row_number() over (partition by event_id,timestamp_formatted order by cast (day as integer) desc) as row_num,*
    FROM
     "dap_txma_stage"."ipv_cri_cic"
    ) 
    where  row_num=1  
    ) Auth
    join conformed.BatchControl BatC
    On Auth.Product_family=BatC.Product_family
    and to_date(processed_date,'YYYYMMDD') > NVL(MaxRunDate,null)
    join conformed.REF_EVENTS ref
    on Auth.EVENT_NAME=ref.event_name
    with no schema binding;


Create or replace view conformed.v_stg_ipv_cri_f2f
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
    Null REJECTION_REASON,
    Null REASON,
    Null NOTIFICATION_TYPE,
    Null MFA_TYPE,
    Null ACCOUNT_RECOVERY, 
    failedcheckdetails_biometricverificationprocesslevel FAILED_CHECK_DETAILS_BIOMETRIC_VERIFICATION_PROCESS_LEVEL,
    checkdetails_biometricverificationprocesslevel CHECK_DETAILS_BIOMETRIC_VERIFICATION_PROCESS_LEVEL,
    strengthscore strength_score,
    extensions_successful successful,
    Null ADDRESSES_ENTERED,
    activityhistoryscore ACTIVITY_HISTORY_SCORE,
    Null IDENTITY_FRAUD_SCORE,
    Null DECISION_SCORE,
    Null FAILED_CHECK_DETAILS_KBV_RESPONSE_MODE,
    failedcheckdetails_checkmethod FAILED_CHECK_DETAILS_CHECK_METHOD,
    Null CHECK_DETAILS_KBV_RESPONSE_MODEL,
    Null CHECK_DETAILS_KBV_QUALITY,
    verificationScore VERIFICATION_SCORE,
    checkdetails_checkmethod CHECK_DETAILS_CHECK_METHOD,
    checkdetails_photoverificationprocesslevel  checkdetails_photo_verification_process_level,
    extensions_iss Iss,
    extensions_previousgovuksigninjourneyid,
    restricted_passport,
    restricted_residencepermit,
    restricted_drivingpermit,
    restricted_idcard,
    validityscore VALIDITY_SCORE,
    type "TYPE",
    BatC.product_family batch_product_family,
    BatC.maxrundate,
    ref.product_family ref_product_family,
    ref.domain,
    ref.sub_domain,
    ref.other_sub_domain 
    from 
    ( select * from 
        (SELECT
            'ipv_cri_f2f' Product_family 
                ,row_number() over (partition by event_id,timestamp_formatted order by cast (day as integer) desc) as row_num
                ,*
        FROM
                    (with base_data as
                (SELECT
                    event_id,
                    event_name,
                    client_id,
                    component_id,
                    "timestamp",
                    timestamp_formatted,
                    user_govuk_signin_journey_id,
                    user_user_id,
                    year,
                    month,
                    day,
                    processed_date,
                    extensions_iss,
                    extensions_successful,
                    extensions_evidence,
                    extensions_previousgovuksigninjourneyid,
                    restricted_passport,
                    restricted_residencepermit,
                    restricted_drivingpermit,
                    restricted_idcard,
                    nvl2(valid_json_data,valid_json_data.activityHistoryScore ,valid_json_data) AS activityhistoryscore,
                    nvl2(valid_json_data,valid_json_data.checkdetails,valid_json_data) AS checkdetails,
                    nvl2(valid_json_data,valid_json_data.failedcheckdetails,valid_json_data) AS failedcheckdetails,
                    nvl2(valid_json_data,valid_json_data.strengthscore,valid_json_data) AS strengthscore,
                    nvl2(valid_json_data,valid_json_data.type,valid_json_data) AS type,
                    nvl2(valid_json_data,valid_json_data.validityscore,valid_json_data) AS validityscore    ,
                    nvl2(valid_json_data,valid_json_data.verificationScore,valid_json_data) AS verificationScore 
                    FROM (
                        SELECT
                            event_id,
                            event_name,
                            client_id,
                            component_id,
                            "timestamp",
                            timestamp_formatted,
                            user_govuk_signin_journey_id,
                            user_user_id,
                            year,
                            month,
                            day,
                            processed_date,
                            extensions_evidence,
                            extensions_iss,
                            extensions_successful,
                            extensions_previousgovuksigninjourneyid,
                            restricted_passport,
                            restricted_residencepermit,
                            restricted_drivingpermit,
                            restricted_idcard,
                            case extensions_evidence != ''
                            and is_valid_json_array(extensions_evidence)
                            when true then json_parse(
                                json_extract_array_element_text(extensions_evidence, 0)
                            )
                            else null end as valid_json_data
                        FROM
                            "dap_txma_reporting_db"."dap_txma_stage"."ipv_cri_ftof"
                        --where event_id='e246497b-6a85-4729-ac9c-583c842ea08c'  
                        --and user_user_id='TestkbvdropoutF2F'
                    )), level_1_data as
                (SELECT
                            event_id,
                            event_name,
                            client_id,
                            component_id,
                            "timestamp",
                            timestamp_formatted,
                            user_govuk_signin_journey_id,
                            user_user_id,
                            year,
                            month,
                            day,
                            processed_date,
                            activityhistoryscore,
                            strengthscore,
                            extensions_successful,
                            verificationScore ,
                            extensions_iss,
                            extensions_previousgovuksigninjourneyid,
                            restricted_passport,
                            restricted_residencepermit,
                            restricted_drivingpermit,
                            restricted_idcard,
                            json_serialize(checkdetails) checkdetails_final,
                            json_serialize(failedcheckdetails) failedcheckdetails_final,
                            type,
                            validityscore
                        FROM
                            base_data
                            where json_serialize(failedcheckdetails) != ''
                ),level_2_data as
                (select 
                        event_id,
                        event_name,
                        client_id,
                        component_id,
                        "timestamp",
                        timestamp_formatted,
                        user_govuk_signin_journey_id,
                        user_user_id,
                        year,
                        month,
                        day,
                        processed_date,
                        verificationScore,
                        extensions_successful,
                        extensions_iss,
                        extensions_previousgovuksigninjourneyid,
                        restricted_passport,
                        restricted_residencepermit,
                        restricted_drivingpermit,
                        restricted_idcard,
                        activityhistoryscore,
                        strengthscore,
                        type,
                        validityscore,
                        case failedcheckdetails_final != ''
                            and is_valid_json_array(failedcheckdetails_final)
                            when true then json_parse(
                                json_extract_array_element_text(failedcheckdetails_final, 0)
                            )
                        else null end as valid_json_failedcheckdetails_data,
                        case checkdetails_final != ''
                            and is_valid_json_array(checkdetails_final)
                            when true then json_parse(
                                json_extract_array_element_text(checkdetails_final, 0)
                            )
                        else null end as valid_json_checkdetails_data  
                from level_1_data
                )
                select 
                    event_id,
                    event_name,
                    client_id,
                    component_id,
                    "timestamp",
                    timestamp_formatted,
                    user_govuk_signin_journey_id,
                    user_user_id,
                    year,
                    month,
                    day,
                    processed_date,
                    verificationScore,
                    extensions_successful,
                    extensions_iss,
                    extensions_previousgovuksigninjourneyid,
                    restricted_passport,
                    restricted_residencepermit,
                    restricted_drivingpermit,
                    restricted_idcard,
                    activityhistoryscore,
                    strengthscore,
                    type,
                    validityscore,
                    nvl2(valid_json_failedcheckdetails_data,valid_json_failedcheckdetails_data.checkmethod,valid_json_failedcheckdetails_data) AS failedcheckdetails_checkmethod,
                    nvl2(valid_json_failedcheckdetails_data,valid_json_failedcheckdetails_data.biometricverificationprocesslevel,valid_json_failedcheckdetails_data) AS        
                    failedcheckdetails_biometricverificationprocesslevel,
                    
                    nvl2(valid_json_checkdetails_data,valid_json_checkdetails_data.checkmethod,valid_json_checkdetails_data) AS checkdetails_checkmethod,
                    nvl2(valid_json_checkdetails_data,valid_json_checkdetails_data.biometricverificationprocesslevel,valid_json_checkdetails_data) AS      
                    checkdetails_biometricverificationprocesslevel,
                    nvl2(valid_json_checkdetails_data,valid_json_checkdetails_data.photoverificationprocesslevel,valid_json_checkdetails_data) AS      
                    checkdetails_photoverificationprocesslevel
                from  level_2_data 
        ) 
        )
        where  row_num=1  
        ) Auth
        join conformed.BatchControl BatC
        On Auth.Product_family=BatC.Product_family
        and to_date(processed_date,'YYYYMMDD')  > NVL(MaxRunDate,null)
        join conformed.REF_EVENTS ref
        on Auth.EVENT_NAME=ref.event_name
        with no schema binding;                 




    raise info 'Setup of conformed layer ran successfully';

    ---

EXCEPTION WHEN OTHERS THEN 
    RAISE EXCEPTION'[Error while setting up conformed layer] Exception: %',sqlerrm;

END;

$$ language plpgsql;