CREATE OR REPLACE PROCEDURE conformed.sp_auth_orchestration () 
AS $$ 
BEGIN 

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

    --

    UPDATE conformed.DIM_EVENT
    SET 
    EVENT_NAME = st.EVENT_NAME,
    EVENT_DESCRIPTION = st.EVENT_NAME,
    PRODUCT_FAMILY=REF_PRODUCT_FAMILY,
    EVENT_JOURNEY_TYPE = st.domain,
    SERVICE_NAME = st.sub_domain,
    MODIFIED_BY='DUMMY_NEW',
    MODIFIED_DATE=CURRENT_DATE,
    BATCH_ID=0000
    FROM (
    SELECT *
    FROM conformed.v_stg_auth_orchestration
    WHERE EVENT_NAME IN (
        SELECT EVENT_NAME
        FROM conformed.DIM_EVENT
    )
    ) AS st
    WHERE DIM_EVENT.EVENT_NAME = st.event_name;

    --

    INSERT INTO conformed.DIM_EVENT ( EVENT_NAME, EVENT_DESCRIPTION, PRODUCT_FAMILY ,EVENT_JOURNEY_TYPE, SERVICE_NAME, CREATED_BY, CREATED_DATE, MODIFIED_BY, MODIFIED_DATE,BATCH_ID)
    SELECT DISTINCT EVENT_NAME, EVENT_NAME, REF_PRODUCT_FAMILY ,domain, sub_domain,'DUMMY',CURRENT_DATE,'DUMMY', CURRENT_DATE,9999
    FROM conformed.v_stg_auth_orchestration
    WHERE EVENT_NAME NOT IN (SELECT EVENT_NAME FROM conformed.DIM_EVENT);

    --

    UPDATE conformed.DIM_JOURNEY_CHANNEL
    SET 
    CHANNEL_NAME = CASE 
        WHEN EVENT_NAME LIKE '%IPV%' THEN 'Web'
        WHEN EVENT_NAME LIKE '%DCMAW%' THEN 'App'
        ELSE 'General'
    END,
    CHANNEL_DESCRIPTION = CASE 
        WHEN EVENT_NAME LIKE '%IPV%' THEN 'Event has taken place via Web channel'
        WHEN EVENT_NAME LIKE '%DCMAW%' THEN 'Event has taken place via App channel'
        ELSE 'General - This is the default channel'
    END,
    MODIFIED_BY='DUMMY_NEW',
    MODIFIED_DATE=CURRENT_DATE,
    BATCH_ID=0000
    FROM (
    SELECT DISTINCT EVENT_NAME
    FROM conformed.v_stg_auth_orchestration
    ) AS st
    WHERE (
    CASE 
        WHEN st.EVENT_NAME LIKE '%IPV%' THEN 'Web'
        WHEN st.EVENT_NAME LIKE '%DCMAW%' THEN 'App'
        ELSE 'General'
    END
    ) = conformed.DIM_JOURNEY_CHANNEL.CHANNEL_NAME
    AND (
    CASE 
        WHEN st.EVENT_NAME LIKE '%IPV%' THEN 'Web'
        WHEN st.EVENT_NAME LIKE '%DCMAW%' THEN 'App'
        ELSE 'General'
    END
    ) IN (
    SELECT CHANNEL_NAME
    FROM conformed.DIM_JOURNEY_CHANNEL
    );

    --

    INSERT INTO conformed.DIM_JOURNEY_CHANNEL (CHANNEL_NAME, CHANNEL_DESCRIPTION, CREATED_BY, CREATED_DATE, MODIFIED_BY, MODIFIED_DATE, BATCH_ID)
    SELECT DISTINCT CASE 
            WHEN EVENT_NAME LIKE '%IPV%' THEN 'Web'
            WHEN EVENT_NAME LIKE '%DCMAW%' THEN 'App'
            ELSE 'General'
        END,
        CASE 
            WHEN EVENT_NAME LIKE '%IPV%' THEN 'Event has taken place via Web channel'
            WHEN EVENT_NAME LIKE '%DCMAW%' THEN 'Event has taken place via App channel'
            ELSE 'General - This is the default channel'
        END,
        'DUMMY',
        CURRENT_DATE,
        'DUMMY',
        CURRENT_DATE,
        9999
    FROM conformed.v_stg_auth_orchestration AS st
    WHERE (CASE 
            WHEN st.EVENT_NAME LIKE '%IPV%' THEN 'Web'
            WHEN st.EVENT_NAME LIKE '%DCMAW%' THEN 'App'
            ELSE 'General'
        END) NOT IN (
            SELECT CHANNEL_NAME
            FROM conformed.DIM_JOURNEY_CHANNEL
        );

    --

    UPDATE conformed.DIM_RELYING_PARTY
    SET 
    CLIENT_NAME = extensions_clientname,
    RELYING_PARTY_NAME = CASE 
        WHEN CLIENT_ID ='7y-bchtHDfucVR5kcAe8KaM80wg' THEN 'HMRC'
        WHEN CLIENT_ID = 'RqFZ83csmS4Mi4Y7s7ohD9-ekwU' THEN 'DVSA'
        WHEN CLIENT_ID = 'LUIZbIuJ_xVZxwhkNAApcO4O_6o' THEN 'SWE'
        WHEN CLIENT_ID = 'VsAkrtMBzAosSveAv4xsuUDyiSs' THEN 'HMLR'
        WHEN CLIENT_ID = 'TGygWFxGDNn8ItyaecWCopqIX3s' THEN 'OFQUAL'
        WHEN CLIENT_ID = 'pDqO7_Hu-pq5wam5I4MlURXrv5k' THEN 'MSU'
        WHEN CLIENT_ID = 'MjQc1h7nFVbNM05iawAdkkZ2W89uloDK' THEN 'Smoke Test'
    ELSE CLIENT_ID
    END,
    RELYING_PARTY_DESCRIPTION = CASE 
        WHEN CLIENT_ID ='7y-bchtHDfucVR5kcAe8KaM80wg' THEN 'This Relying party is HMRC'
        WHEN CLIENT_ID = 'RqFZ83csmS4Mi4Y7s7ohD9-ekwU' THEN 'This Relying party is DVSA'
        WHEN CLIENT_ID = 'LUIZbIuJ_xVZxwhkNAApcO4O_6o' THEN 'This Relying party is SWE'
        WHEN CLIENT_ID = 'VsAkrtMBzAosSveAv4xsuUDyiSs' THEN 'This Relying party is HMLR'
        WHEN CLIENT_ID = 'TGygWFxGDNn8ItyaecWCopqIX3s' THEN 'This Relying party is OFQUAL'
        WHEN CLIENT_ID = 'pDqO7_Hu-pq5wam5I4MlURXrv5k' THEN 'This Relying party is MSU'
        WHEN CLIENT_ID = 'MjQc1h7nFVbNM05iawAdkkZ2W89uloDK' THEN 'This is a dummy test id'
    ELSE CLIENT_ID
    END
    FROM (
    SELECT DISTINCT CLIENT_ID, extensions_clientname
    FROM conformed.v_stg_auth_orchestration
    ) AS st
    WHERE (
    CASE 
        WHEN CLIENT_ID ='7y-bchtHDfucVR5kcAe8KaM80wg' THEN 'HMRC'
        WHEN CLIENT_ID = 'RqFZ83csmS4Mi4Y7s7ohD9-ekwU' THEN 'DVSA'
        WHEN CLIENT_ID = 'LUIZbIuJ_xVZxwhkNAApcO4O_6o' THEN 'SWE'
        WHEN CLIENT_ID = 'VsAkrtMBzAosSveAv4xsuUDyiSs' THEN 'HMLR'
        WHEN CLIENT_ID = 'TGygWFxGDNn8ItyaecWCopqIX3s' THEN 'OFQUAL'
        WHEN CLIENT_ID = 'pDqO7_Hu-pq5wam5I4MlURXrv5k' THEN 'MSU'
        WHEN CLIENT_ID = 'MjQc1h7nFVbNM05iawAdkkZ2W89uloDK' THEN 'Smoke Test'
    ELSE CLIENT_ID
    END
    ) = conformed.DIM_RELYING_PARTY.RELYING_PARTY_NAME
    AND (
    CASE 
        WHEN CLIENT_ID ='7y-bchtHDfucVR5kcAe8KaM80wg' THEN 'HMRC'
        WHEN CLIENT_ID = 'RqFZ83csmS4Mi4Y7s7ohD9-ekwU' THEN 'DVSA'
        WHEN CLIENT_ID = 'LUIZbIuJ_xVZxwhkNAApcO4O_6o' THEN 'SWE'
        WHEN CLIENT_ID = 'VsAkrtMBzAosSveAv4xsuUDyiSs' THEN 'HMLR'
        WHEN CLIENT_ID = 'TGygWFxGDNn8ItyaecWCopqIX3s' THEN 'OFQUAL'
        WHEN CLIENT_ID = 'pDqO7_Hu-pq5wam5I4MlURXrv5k' THEN 'MSU'
        WHEN CLIENT_ID = 'MjQc1h7nFVbNM05iawAdkkZ2W89uloDK' THEN 'Smoke Test'
    ELSE CLIENT_ID
    END
    ) IN (
    SELECT RELYING_PARTY_NAME
    FROM conformed.DIM_RELYING_PARTY
    );

    --

    INSERT INTO  conformed.DIM_RELYING_PARTY (CLIENT_NAME, RELYING_PARTY_NAME, RELYING_PARTY_DESCRIPTION, CREATED_BY, CREATED_DATE, MODIFIED_BY, MODIFIED_DATE, BATCH_ID)
    SELECT DISTINCT 
        extensions_clientname ,
        CASE 
            WHEN CLIENT_ID ='7y-bchtHDfucVR5kcAe8KaM80wg' THEN 'HMRC'
            WHEN CLIENT_ID = 'RqFZ83csmS4Mi4Y7s7ohD9-ekwU' THEN 'DVSA'
            WHEN CLIENT_ID = 'LUIZbIuJ_xVZxwhkNAApcO4O_6o' THEN 'SWE'
            WHEN CLIENT_ID = 'VsAkrtMBzAosSveAv4xsuUDyiSs' THEN 'HMLR'
            WHEN CLIENT_ID = 'TGygWFxGDNn8ItyaecWCopqIX3s' THEN 'OFQUAL'
            WHEN CLIENT_ID = 'pDqO7_Hu-pq5wam5I4MlURXrv5k' THEN 'MSU'
            WHEN CLIENT_ID = 'MjQc1h7nFVbNM05iawAdkkZ2W89uloDK' THEN 'Smoke Test'
            ELSE CLIENT_ID
        END,
        CASE 
            WHEN CLIENT_ID ='7y-bchtHDfucVR5kcAe8KaM80wg' THEN 'This Relying party is HMRC'
            WHEN CLIENT_ID = 'RqFZ83csmS4Mi4Y7s7ohD9-ekwU' THEN 'This Relying party is DVSA'
            WHEN CLIENT_ID = 'LUIZbIuJ_xVZxwhkNAApcO4O_6o' THEN 'This Relying party is SWE'
            WHEN CLIENT_ID = 'VsAkrtMBzAosSveAv4xsuUDyiSs' THEN 'This Relying party is HMLR'
            WHEN CLIENT_ID = 'TGygWFxGDNn8ItyaecWCopqIX3s' THEN 'This Relying party is OFQUAL'
            WHEN CLIENT_ID = 'pDqO7_Hu-pq5wam5I4MlURXrv5k' THEN 'This Relying party is MSU'
            WHEN CLIENT_ID = 'MjQc1h7nFVbNM05iawAdkkZ2W89uloDK' THEN 'This is a dummy test id'
            ELSE CLIENT_ID
        END,
        'DUMMY',
        CURRENT_DATE,
        'DUMMY',
        CURRENT_DATE,
        9999
    FROM conformed.v_stg_auth_orchestration AS st
    WHERE CASE 
            WHEN CLIENT_ID ='7y-bchtHDfucVR5kcAe8KaM80wg' THEN 'HMRC'
            WHEN CLIENT_ID = 'RqFZ83csmS4Mi4Y7s7ohD9-ekwU' THEN 'DVSA'
            WHEN CLIENT_ID = 'LUIZbIuJ_xVZxwhkNAApcO4O_6o' THEN 'SWE'
            WHEN CLIENT_ID = 'VsAkrtMBzAosSveAv4xsuUDyiSs' THEN 'HMLR'
            WHEN CLIENT_ID = 'TGygWFxGDNn8ItyaecWCopqIX3s' THEN 'OFQUAL'
            WHEN CLIENT_ID = 'pDqO7_Hu-pq5wam5I4MlURXrv5k' THEN 'MSU'
            WHEN CLIENT_ID = 'MjQc1h7nFVbNM05iawAdkkZ2W89uloDK' THEN 'Smoke Test'
            ELSE CLIENT_ID
        END NOT IN (
            SELECT RELYING_PARTY_NAME
            FROM conformed.DIM_RELYING_PARTY
        );

    --

    UPDATE conformed.DIM_VERIFICATION_ROUTE
    SET 
        VERIFICATION_ROUTE_NAME = st.sub_domain,
        VERIFICATION_SHORT_NAME = st.sub_domain,
        ROUTE_DESCRIPTION = st.DOMAIN
    FROM (
        SELECT DISTINCT DOMAIN, sub_domain
        FROM conformed.v_stg_auth_orchestration
        WHERE sub_domain IN (
            SELECT VERIFICATION_ROUTE_NAME
            FROM conformed.DIM_VERIFICATION_ROUTE
        )
    ) AS st
    WHERE st.sub_domain = conformed.DIM_VERIFICATION_ROUTE.VERIFICATION_ROUTE_NAME;


    INSERT INTO conformed.DIM_VERIFICATION_ROUTE ( VERIFICATION_ROUTE_NAME, VERIFICATION_SHORT_NAME, ROUTE_DESCRIPTION, CREATED_BY, CREATED_DATE, MODIFIED_BY, MODIFIED_DATE,BATCH_ID)
    SELECT DISTINCT sub_domain, sub_domain, domain,'DUMMY',CURRENT_DATE,'DUMMY', CURRENT_DATE,9999
    FROM conformed.v_stg_auth_orchestration
    WHERE sub_domain NOT IN (SELECT VERIFICATION_ROUTE_NAME  FROM conformed.DIM_VERIFICATION_ROUTE);

    --

    UPDATE "dap_txma_reporting_db"."conformed"."fact_user_journey_event" 
    SET 
    REJECTION_REASON=st.REJECTION_REASON
    ,REASON=st.REASON
    ,NOTIFICATION_TYPE=st.NOTIFICATION_TYPE
    ,MFA_TYPE=st.MFA_TYPE
    ,ACCOUNT_RECOVERY=st.ACCOUNT_RECOVERY
    ,FAILED_CHECK_DETAILS_BIOMETRIC_VERIFICATION_PROCESS_LEVEL=st.FAILED_CHECK_DETAILS_BIOMETRIC_VERIFICATION_PROCESS_LEVEL
    ,CHECK_DETAILS_BIOMETRIC_VERIFICATION_PROCESS_LEVEL=st.CHECK_DETAILS_BIOMETRIC_VERIFICATION_PROCESS_LEVEL
    ,ADDRESSES_ENTERED=st.ADDRESSES_ENTERED
    ,ACTIVITY_HISTORY_SCORE=st.ACTIVITY_HISTORY_SCORE
    ,IDENTITY_FRAUD_SCORE=st.IDENTITY_FRAUD_SCORE
    ,DECISION_SCORE=st.DECISION_SCORE
    ,FAILED_CHECK_DETAILS_KBV_RESPONSE_MODE=st.FAILED_CHECK_DETAILS_KBV_RESPONSE_MODE
    ,FAILED_CHECK_DETAILS_CHECK_METHOD=st.FAILED_CHECK_DETAILS_CHECK_METHOD
    ,CHECK_DETAILS_KBV_RESPONSE_MODEL=st.CHECK_DETAILS_KBV_RESPONSE_MODEL
    ,CHECK_DETAILS_KBV_QUALITY=st.CHECK_DETAILS_KBV_QUALITY
    ,VERIFICATION_SCORE=st.VERIFICATION_SCORE
    ,CHECK_DETAILS_CHECK_METHOD=st.CHECK_DETAILS_CHECK_METHOD
    ,Iss=st.Iss
    ,VALIDITY_SCORE=st.VALIDITY_SCORE
    ,"TYPE"=st."TYPE"
    ,PROCESSED_DATE=st.PROCESSED_DATE
    ,MODIFIED_BY='DUMMY_NEW'
    ,MODIFIED_DATE=CURRENT_DATE
    ,BATCH_ID=0000
    FROM (SELECT *
    FROM conformed.v_stg_auth_orchestration
    WHERE EVENT_ID IN (
        SELECT EVENT_ID
        FROM "dap_txma_reporting_db"."conformed"."fact_user_journey_event" 
    ) )AS st
    WHERE fact_user_journey_event.EVENT_ID = st.EVENT_ID;


    INSERT INTO conformed.FACT_USER_JOURNEY_EVENT (EVENT_KEY,DATE_KEY,verification_route_key,journey_channel_key,relying_party_key,USER_ID,
                            EVENT_ID,EVENT_TIME,JOURNEY_ID,COMPONENT_ID,EVENT_COUNT,
                            REJECTION_REASON,REASON,NOTIFICATION_TYPE,MFA_TYPE,ACCOUNT_RECOVERY,FAILED_CHECK_DETAILS_BIOMETRIC_VERIFICATION_PROCESS_LEVEL,
                            CHECK_DETAILS_BIOMETRIC_VERIFICATION_PROCESS_LEVEL,ADDRESSES_ENTERED,ACTIVITY_HISTORY_SCORE,IDENTITY_FRAUD_SCORE,DECISION_SCORE,
                            FAILED_CHECK_DETAILS_KBV_RESPONSE_MODE,FAILED_CHECK_DETAILS_CHECK_METHOD,CHECK_DETAILS_KBV_RESPONSE_MODEL,CHECK_DETAILS_KBV_QUALITY,
                            VERIFICATION_SCORE,CHECK_DETAILS_CHECK_METHOD,Iss,VALIDITY_SCORE,"TYPE", PROCESSED_DATE,
                            CREATED_BY, CREATED_DATE, MODIFIED_BY, MODIFIED_DATE, BATCH_ID)
    SELECT NVL(DE.event_key,-1) AS event_key
        ,dd.date_key
        ,NVL(dvr.verification_route_key,-1) AS verification_route_key
        , NVL(djc.journey_channel_key,-1) AS journey_channel_key
        , NVL(drp.relying_party_key,-1) AS relying_party_key
        ,user_user_id AS USER_ID
        ,event_id AS EVENT_ID
        --,cnf.event_name
        --,cnf.timestamp AS EVENT_TIME
        ,cnf.timestamp_formatted as EVENT_TIME
        ,cnf.user_govuk_signin_journey_id AS JOURNEY_ID
        ,cnf.component_id AS COMPONENT_ID
        ,EVENT_COUNT
        ,REJECTION_REASON
        ,REASON
        ,NOTIFICATION_TYPE
        ,MFA_TYPE,ACCOUNT_RECOVERY
        ,FAILED_CHECK_DETAILS_BIOMETRIC_VERIFICATION_PROCESS_LEVEL
        ,CHECK_DETAILS_BIOMETRIC_VERIFICATION_PROCESS_LEVEL
        ,ADDRESSES_ENTERED
        ,ACTIVITY_HISTORY_SCORE
        ,IDENTITY_FRAUD_SCORE
        ,DECISION_SCORE
        ,FAILED_CHECK_DETAILS_KBV_RESPONSE_MODE
        ,FAILED_CHECK_DETAILS_CHECK_METHOD
        ,CHECK_DETAILS_KBV_RESPONSE_MODEL
        ,CHECK_DETAILS_KBV_QUALITY
        ,VERIFICATION_SCORE
        ,CHECK_DETAILS_CHECK_METHOD
        ,Iss
        ,VALIDITY_SCORE
        ,"TYPE"
        ,PROCESSED_DATE
        ,'DUMMY'
        , CURRENT_DATE
        ,'DUMMY'
        , CURRENT_DATE
        , 9999
    FROM (SELECT *
    FROM conformed.v_stg_auth_orchestration
    WHERE EVENT_ID NOT IN (
        SELECT EVENT_ID
        FROM conformed.FACT_USER_JOURNEY_EVENT))cnf
    JOIN conformed.dim_date dd ON date(cnf.timestamp_formatted)= dd.date
    LEFT JOIN conformed.DIM_EVENT DE ON cnf.event_name = DE.EVENT_NAME
    LEFT JOIN conformed.dim_journey_channel djc ON 
        (CASE 
            WHEN cnf.EVENT_NAME LIKE '%IPV%' THEN 'Web'
            WHEN cnf.EVENT_NAME LIKE '%DCMAW%' THEN 'App'
            ELSE 'General'
        END) = djc.channel_name
    LEFT JOIN conformed.dim_relying_party drp ON 
        (CASE cnf.CLIENT_ID
            WHEN '7y-bchtHDfucVR5kcAe8KaM80wg' THEN 'HMRC'
            WHEN 'RqFZ83csmS4Mi4Y7s7ohD9-ekwU' THEN 'DVSA'
            WHEN 'LUIZbIuJ_xVZxwhkNAApcO4O_6o' THEN 'SWE'
            WHEN 'VsAkrtMBzAosSveAv4xsuUDyiSs' THEN 'HMLR'
            WHEN 'TGygWFxGDNn8ItyaecWCopqIX3s' THEN 'OFQUAL'
            WHEN 'pDqO7_Hu-pq5wam5I4MlURXrv5k' THEN 'MSU'
            WHEN 'MjQc1h7nFVbNM05iawAdkkZ2W89uloDK' THEN 'Smoke Test'
            ELSE cnf.CLIENT_ID
        END) = drp.relying_party_name
    LEFT JOIN conformed.dim_verification_route dvr 
        ON  cnf.sub_domain = dvr.verification_route_name; 

    --

    UPDATE conformed.BatchControl BATC
    SET MaxRunDate = CAST(subquery.updated_value AS DATE)
    FROM (
    SELECT PRODUCT_FAMILY, MAX(PROCESSED_DATE) updated_value
    FROM conformed.v_stg_auth_orchestration
    GROUP BY PRODUCT_FAMILY
    ) AS subquery
    WHERE BATC.Product_family =subquery.PRODUCT_FAMILY;

    --

    INSERT into conformed.err_duplicate_event_id (event_count,product_family,event_id,timestamp_formatted,processed_date,created_by,created_datetime)
    SELECT event_count,Product_family,event_id,timestamp_formatted,processed_date,'DUMMY',GETDATE() AS Current_date
    FROM
        (
            SELECT COUNT(*) AS event_count,auth.Product_family,event_id,timestamp_formatted,processed_date
            FROM
                (
                    SELECT
                        'auth_orchestration' AS Product_family,
                        ROW_NUMBER() OVER (PARTITION BY event_id, timestamp_formatted ORDER BY timestamp_formatted) AS row_num,
                        *
                    FROM
                        "dap_txma_reporting_db"."dap_txma_stage"."auth_orchestration" 
                ) auth
            JOIN "dap_txma_reporting_db"."conformed"."batchcontrol" batc ON auth.Product_family = batc.product_family
                AND auth.processed_date > batc.maxrundate
            WHERE row_num <> 1
            AND (auth.product_family,event_name, processed_date) NOT IN (SELECT product_family ,event_name, processed_date 
                                                                        FROM conformed.err_duplicate_event_id)
            GROUP BY
                auth.Product_family,
                event_id,
                timestamp_formatted,
                processed_date
        ) subquery;

    --
            
    RAISE INFO ' processing of product family: auth_orchestration ran successfully '; 
    
    EXCEPTION WHEN OTHERS THEN
        RAISE EXCEPTION ' [error while processing product family: auth_orchestration] exception: % ',sqlerrm; 

END; 

$$ LANGUAGE PLPGSQL;