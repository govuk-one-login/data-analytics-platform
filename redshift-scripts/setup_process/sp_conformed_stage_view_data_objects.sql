CREATE OR REPLACE PROCEDURE conformed.sp_conformed_stage_view_data_objects() 
AS $$ 
BEGIN 
/*
Name       Date         Notes
P Sodhi    15/09/2023   Update to ipv_cri_kbv view.
*/

    Create or replace view conformed.V_STG_auth_account_creation
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
        'auth_account_creation'Product_family 
        ,row_number() over (partition by event_id,timestamp_formatted order by cast (day as integer) desc) as row_num,*
    FROM
        "dap_txma_reporting_db"."dap_txma_stage"."auth_account_creation") 
        where  row_num=1 ) Auth
        join conformed.BatchControl BatC
        On Auth.Product_family=BatC.Product_family
        and to_date(processed_date,'YYYYMMDD')  > NVL(MaxRunDate,null)
        join conformed.REF_EVENTS ref
        on Auth.EVENT_NAME=ref.event_name
        with no schema binding;

    ---

    Create or replace view conformed.v_stg_auth_orchestration
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
        "dap_txma_reporting_db"."dap_txma_stage"."auth_orchestration") 
        where  row_num=1  
        ) Auth
        join conformed.BatchControl BatC
        On Auth.Product_family=BatC.Product_family
        and to_date(processed_date,'YYYYMMDD')  > NVL(MaxRunDate,null)
        join conformed.REF_EVENTS ref
        on Auth.EVENT_NAME=ref.event_name
        with no schema binding;

    ---

    Create or replace view conformed.v_stg_auth_account_user_login
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
            'auth_account_user_login' Product_family 
                ,row_number() over (partition by event_id,timestamp_formatted order by cast (day as integer) desc) as row_num,*
        FROM
        "dap_txma_reporting_db"."dap_txma_stage"."auth_account_user_login") 
        where  row_num=1  
        ) Auth
        join conformed.BatchControl BatC
        On Auth.Product_family=BatC.Product_family
        and to_date(processed_date,'YYYYMMDD')  > NVL(MaxRunDate,null)
        join conformed.REF_EVENTS ref
        on Auth.EVENT_NAME=ref.event_name
        with no schema binding;

    ---

    Create or replace view conformed.v_stg_dcmaw_cri
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
    Null IDENTITY_FRAUD_SCORE,
    Null DECISION_SCORE,
    Null FAILED_CHECK_DETAILS_KBV_RESPONSE_MODE,
    failedcheckdetails_checkmethod FAILED_CHECK_DETAILS_CHECK_METHOD,
    Null CHECK_DETAILS_KBV_RESPONSE_MODEL,
    Null CHECK_DETAILS_KBV_QUALITY,
    Null VERIFICATION_SCORE,
    checkdetails_checkmethod CHECK_DETAILS_CHECK_METHOD,
    Null Iss,
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
            'dcmaw_cri' Product_family 
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
                    extensions_evidence,
                    nvl2(valid_json_data,valid_json_data.activityHistoryScore ,valid_json_data) AS activityhistoryscore,
                    nvl2(valid_json_data,valid_json_data.checkdetails,valid_json_data) AS checkdetails,
                    nvl2(valid_json_data,valid_json_data.failedcheckdetails,valid_json_data) AS failedcheckdetails,
                    nvl2(valid_json_data,valid_json_data.strengthscore,valid_json_data) AS strengthscore,
                    nvl2(valid_json_data,valid_json_data.type,valid_json_data) AS type,
                    nvl2(valid_json_data,valid_json_data.validityscore,valid_json_data) AS validityscore    
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
                            case extensions_evidence != ''
                            and is_valid_json_array(extensions_evidence)
                            when true then json_parse(
                                json_extract_array_element_text(extensions_evidence, 0)
                            )
                            else null end as valid_json_data
                        FROM
                            "dap_txma_reporting_db"."dap_txma_stage"."dcmaw_cri"
                            --where extensions_evidence != ''
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
                            processed_date,
                            activityhistoryscore,
                            strengthscore,
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
                    activityhistoryscore,
                    strengthscore,
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
        and to_date(processed_date,'YYYYMMDD')  > NVL(MaxRunDate,null)
        join conformed.REF_EVENTS ref
        on Auth.EVENT_NAME=ref.event_name
        with no schema binding;

    ---

    Create or replace view conformed.v_stg_auth_account_mfa
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
    extensions_notificationtype NOTIFICATION_TYPE,
    extensions_mfatype MFA_TYPE,
    extensions_accountrecovery ACCOUNT_RECOVERY,
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
            'auth_account_mfa' Product_family 
                ,row_number() over (partition by event_id,timestamp_formatted order by cast (day as integer) desc) as row_num,*
        FROM
        "dap_txma_reporting_db"."dap_txma_stage"."auth_account_mfa") 
        where  row_num=1  
        ) Auth
        join conformed.BatchControl BatC
        On Auth.Product_family=BatC.Product_family
        and to_date(processed_date,'YYYYMMDD')  > NVL(MaxRunDate,null)
        join conformed.REF_EVENTS ref
        on Auth.EVENT_NAME=ref.event_name
        with no schema binding;

    ---

    Create or replace view conformed.v_stg_auth_account_management
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
            'auth_account_management' Product_family 
                ,row_number() over (partition by event_id,timestamp_formatted order by cast (day as integer) desc) as row_num,*
        FROM
        "dap_txma_reporting_db"."dap_txma_stage"."auth_account_management") 
        where  row_num=1  
        ) Auth
        join conformed.BatchControl BatC
        On Auth.Product_family=BatC.Product_family
        and to_date(processed_date,'YYYYMMDD')  > NVL(MaxRunDate,null)
        join conformed.REF_EVENTS ref
        on Auth.EVENT_NAME=ref.event_name
        with no schema binding;

    ---

    Create or replace view conformed.v_stg_ipv_cri_address
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
        "dap_txma_reporting_db"."dap_txma_stage"."ipv_cri_address") 
        where  row_num=1  
        ) Auth
        join conformed.BatchControl BatC
        On Auth.Product_family=BatC.Product_family
        and to_date(processed_date,'YYYYMMDD')  > NVL(MaxRunDate,null)
        join conformed.REF_EVENTS ref
        on Auth.EVENT_NAME=ref.event_name
        with no schema binding;

    ---

    Create or replace view conformed.v_stg_ipv_cri_driving_license
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
    Null IDENTITY_FRAUD_SCORE,
    Null DECISION_SCORE,
    Null FAILED_CHECK_DETAILS_KBV_RESPONSE_MODE,
    failedcheckdetails_checkmethod FAILED_CHECK_DETAILS_CHECK_METHOD,
    Null CHECK_DETAILS_KBV_RESPONSE_MODEL,
    Null CHECK_DETAILS_KBV_QUALITY,
    Null VERIFICATION_SCORE,
    checkdetails_checkmethod CHECK_DETAILS_CHECK_METHOD,
    extensions_iss Iss,
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
            'ipv_cri_driving_license' Product_family 
                ,row_number() over (partition by event_id,timestamp_formatted order by cast (day as integer) desc) as row_num
                ,*
        FROM
                    (with base_data as
                (SELECT
                    event_id,
                    event_name,
                    client_id,
                    component_id,
                    extensions_iss,
                    "timestamp",
                    timestamp_formatted,
                    user_govuk_signin_journey_id,
                    user_user_id,
                    year,
                    month,
                    day,
                    processed_date,
                    extensions_evidence,
                    nvl2(valid_json_data,valid_json_data.activityHistoryScore ,valid_json_data) AS activityhistoryscore,
                    nvl2(valid_json_data,valid_json_data.checkdetails,valid_json_data) AS checkdetails,
                    nvl2(valid_json_data,valid_json_data.failedcheckdetails,valid_json_data) AS failedcheckdetails,
                    nvl2(valid_json_data,valid_json_data.strengthscore,valid_json_data) AS strengthscore,
                    nvl2(valid_json_data,valid_json_data.type,valid_json_data) AS type,
                    nvl2(valid_json_data,valid_json_data.validityscore,valid_json_data) AS validityscore    
                    FROM (
                        SELECT
                            event_id,
                            event_name,
                            client_id,
                            component_id,
                            "timestamp",
                            extensions_iss,
                            timestamp_formatted,
                            user_govuk_signin_journey_id,
                            user_user_id,
                            year,
                            month,
                            day,
                            processed_date,
                            extensions_evidence,
                            case extensions_evidence != ''
                            and is_valid_json_array(extensions_evidence)
                            when true then json_parse(
                                json_extract_array_element_text(extensions_evidence, 0)
                            )
                            else null end as valid_json_data
                        FROM
                             "prod_txma_stage"."ipv_cri_driving_license"
                            --where extensions_evidence != ''
                            --where event_id='70076134-77f7-4d11-b60d-017c1894e4e9'
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
                            extensions_iss,
                            year,
                            month,
                            day,
                            processed_date,
                            activityhistoryscore,
                            strengthscore,
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
                        extensions_iss,
                        year,
                        month,
                        day,
                        processed_date,
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
                    extensions_iss,
                    processed_date,
                    activityhistoryscore,
                    strengthscore,
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
        and to_date(processed_date,'YYYYMMDD')  > NVL(MaxRunDate,null)
        join conformed.REF_EVENTS ref
        on Auth.EVENT_NAME=ref.event_name
        with no schema binding;

    ---

    Create or replace view conformed.v_stg_ipv_cri_fraud
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
                "dap_txma_reporting_db"."dap_txma_stage"."ipv_cri_fraud"
                --where event_name='IPV_FRAUD_CRI_VC_ISSUED'
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
        from level_2_data
    )
    )
    where row_num=1
    ) Auth
    join conformed.BatchControl BatC
    On Auth.Product_family=BatC.Product_family
    and to_date(processed_date,'YYYYMMDD') > NVL(MaxRunDate,null)
    join conformed.REF_EVENTS ref
    on Auth.EVENT_NAME=ref.event_name
    with no schema binding;

    ---

    Create or replace view conformed.v_stg_ipv_journey
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
    extensions_rejectionreason REJECTION_REASON,
    extensions_reason REASON,
    null NOTIFICATION_TYPE,
    null MFA_TYPE,
    null ACCOUNT_RECOVERY,
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
        "dap_txma_reporting_db"."dap_txma_stage"."ipv_journey")
        where  row_num=1
        ) Auth
        join conformed.BatchControl BatC
        On Auth.Product_family=BatC.Product_family
        and to_date(processed_date,'YYYYMMDD')  > NVL(MaxRunDate,null)
        join conformed.REF_EVENTS ref
        on Auth.EVENT_NAME=ref.event_name
        with no schema binding;

    ---

    Create or replace view conformed.v_stg_ipv_cri_kbv
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
    null FAILED_CHECK_DETAILS_BIOMETRIC_VERIFICATION_PROCESS_LEVEL,
    null CHECK_DETAILS_BIOMETRIC_VERIFICATION_PROCESS_LEVEL,
    null strength_score,
    Null ADDRESSES_ENTERED,
    null ACTIVITY_HISTORY_SCORE,
    Null IDENTITY_FRAUD_SCORE,
    Null DECISION_SCORE,
    failedcheckdetails_kbvresponsemode FAILED_CHECK_DETAILS_KBV_RESPONSE_MODE,
    failedcheckdetails_checkmethod FAILED_CHECK_DETAILS_CHECK_METHOD,
    failedcheckdetails_kbvresponsemode CHECK_DETAILS_KBV_RESPONSE_MODEL,
    checkdetails_kbvquality CHECK_DETAILS_KBV_QUALITY,
    verificationscore VERIFICATION_SCORE,
    checkdetails_checkmethod CHECK_DETAILS_CHECK_METHOD,
    extensions_iss Iss,
    extensions_experianiiqresponse experianiiqresponse,
    null VALIDITY_SCORE,
    type "TYPE",
    BatC.product_family batch_product_family,
    BatC.maxrundate,
    ref.product_family ref_product_family,
    ref.domain,
    ref.sub_domain,
    ref.other_sub_domain from
    ( select * from
        (SELECT
               'ipv_cri_kbv' Product_family
                ,row_number() over (partition by event_id,timestamp_formatted order by cast (day as integer) desc) as row_num
                ,*
        FROM
                    (with base_data as
    (
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
                    extensions_experianiiqresponse,
                    extensions_iss,
                    extensions_evidence,
                    nvl2(valid_json_data,valid_json_data.checkdetails,valid_json_data) AS checkdetails,
                    nvl2(valid_json_data,valid_json_data.failedcheckdetails,valid_json_data) AS failedcheckdetails,
                    nvl2(valid_json_data,valid_json_data.type,valid_json_data) AS type,
                    nvl2(valid_json_data,valid_json_data.verificationscore,valid_json_data) AS verificationscore
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
                            extensions_iss,
                            processed_date,
                            extensions_evidence,
                            extensions_experianiiqresponse,
                            case extensions_evidence != ''
                            and is_valid_json_array(extensions_evidence)
                            when true then json_parse(
                                json_extract_array_element_text(extensions_evidence, 0)
                            )
                            else null end as valid_json_data
                        FROM
                            "dap_txma_reporting_db"."dap_txma_stage"."ipv_cri_kbv"
                            --where extensions_evidence != ''
                            --where  event_id='8bdd3134-c55f-44f8-a2d2-2df361695734'
                    )
    ), level_1_data as
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
                            verificationscore,
                            month,
                            day,
                            processed_date,
                            extensions_evidence,
                            extensions_iss,
                            extensions_experianiiqresponse,
                            json_serialize(checkdetails) checkdetails_final,
                            json_serialize(failedcheckdetails) failedcheckdetails_final,
                            type
                        FROM
                            base_data
                            where json_serialize(failedcheckdetails) != ''
                )
                ,level_2_data as
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
                        verificationscore,
                        extensions_evidence,
                        extensions_iss,
                        extensions_experianiiqresponse,
                        type,
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
                    extensions_iss,
                    verificationscore,
                    extensions_experianiiqresponse,
                    user_user_id,
                    year,
                    month,
                    day,
                    processed_date,
                    type,
                    nvl2(valid_json_failedcheckdetails_data,valid_json_failedcheckdetails_data.checkmethod,valid_json_failedcheckdetails_data) AS failedcheckdetails_checkmethod,
                    nvl2(valid_json_failedcheckdetails_data,valid_json_failedcheckdetails_data.kbvresponsemode,valid_json_failedcheckdetails_data) AS
                    failedcheckdetails_kbvresponsemode,
                    nvl2(valid_json_checkdetails_data,valid_json_checkdetails_data.checkmethod,valid_json_checkdetails_data) AS checkdetails_checkmethod,
                    nvl2(valid_json_checkdetails_data,valid_json_checkdetails_data.kbvquality,valid_json_checkdetails_data) AS
                    checkdetails_kbvquality,
                    nvl2(valid_json_checkdetails_data,valid_json_checkdetails_data.kbvresponsemode,valid_json_checkdetails_data) AS
                    checkdetails_kbvresponsemode
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

    ---

    Create or replace view conformed.v_stg_ipv_cri_passport
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
    null FAILED_CHECK_DETAILS_BIOMETRIC_VERIFICATION_PROCESS_LEVEL,
    null CHECK_DETAILS_BIOMETRIC_VERIFICATION_PROCESS_LEVEL,
    strengthscore strength_score,
    Null ADDRESSES_ENTERED,
    activityhistoryscore ACTIVITY_HISTORY_SCORE,
    identityfraudscore IDENTITY_FRAUD_SCORE,
    decisionscore DECISION_SCORE,
    Null FAILED_CHECK_DETAILS_KBV_RESPONSE_MODE,
    null FAILED_CHECK_DETAILS_CHECK_METHOD,
    Null CHECK_DETAILS_KBV_RESPONSE_MODEL,
    Null CHECK_DETAILS_KBV_QUALITY,
    Null VERIFICATION_SCORE,
    null CHECK_DETAILS_CHECK_METHOD,
    iss Iss,
    validityscore VALIDITY_SCORE,
    type "TYPE",
    BatC.product_family batch_product_family,
    BatC.maxrundate,
    ref.product_family ref_product_family,
    ref.domain,
    ref.sub_domain,
    ref.other_sub_domain from
    (select * from
    (SELECT
               'ipv_cri_passport' Product_family
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
                    nvl2(valid_json_data,valid_json_data.strengthscore,valid_json_data) AS strengthscore,
                    nvl2(valid_json_data,valid_json_data.validityscore,valid_json_data) AS validityscore,
                    null AS decisionscore,
                    null AS identityfraudscore,
                    nvl2(valid_json_data,valid_json_data.type,valid_json_data) AS type
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
                            "dap_txma_reporting_db"."dap_txma_stage"."ipv_cri_passport"
                            --where event_name='IPV_FRAUD_CRI_VC_ISSUED'
                            --where event_id='70c994eb-8fdd-4c9a-9b94-911a3b43cdbb'
                    ))
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
                            iss,
                            processed_date,
                            activityhistoryscore,
                            strengthscore,
                            identityfraudscore ,
                            decisionscore ,
                            type,
                            validityscore
                        FROM
                            base_data
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