CREATE OR replace PROCEDURE conformed.sp_ipv_journey_ipv_identity_issued_temp () 
AS $$
BEGIN  

UPDATE conformed.DIM_EVENT
SET 
  EVENT_NAME = st.EVENT_NAME,
  EVENT_DESCRIPTION = st.EVENT_NAME,
  PRODUCT_FAMILY=REF_PRODUCT_FAMILY,
  EVENT_JOURNEY_TYPE = st.domain,
  SERVICE_NAME = st.sub_domain,
  MODIFIED_BY=current_user,
  MODIFIED_DATE=CURRENT_DATE,
  BATCH_ID=0000
FROM (
  SELECT *
  FROM conformed.v_stg_ipv_journey_ipv_identity_issued_temp
  WHERE EVENT_NAME IN (
    SELECT EVENT_NAME
    FROM conformed.DIM_EVENT
  )
) AS st
WHERE DIM_EVENT.EVENT_NAME = st.event_name;


-- Insert new records into the dimension table
INSERT INTO conformed.DIM_EVENT ( EVENT_NAME, EVENT_DESCRIPTION, PRODUCT_FAMILY ,EVENT_JOURNEY_TYPE, SERVICE_NAME, CREATED_BY, CREATED_DATE, MODIFIED_BY, MODIFIED_DATE,BATCH_ID)
SELECT DISTINCT EVENT_NAME, EVENT_NAME, REF_PRODUCT_FAMILY ,domain, sub_domain,current_user,CURRENT_DATE,current_user, CURRENT_DATE,9999
FROM conformed.v_stg_ipv_journey_ipv_identity_issued_temp
WHERE EVENT_NAME NOT IN (SELECT EVENT_NAME FROM conformed.DIM_EVENT);


----DIM_JOURNEY_CHANNEL

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
  MODIFIED_BY=current_user,
  MODIFIED_DATE=CURRENT_DATE,
  BATCH_ID=0000
FROM (
  SELECT DISTINCT EVENT_NAME
  FROM conformed.v_stg_ipv_journey_ipv_identity_issued_temp
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
    current_user,
    CURRENT_DATE,
    current_user,
    CURRENT_DATE,
    9999
FROM conformed.v_stg_ipv_journey_ipv_identity_issued_temp AS st
WHERE (CASE 
        WHEN st.EVENT_NAME LIKE '%IPV%' THEN 'Web'
        WHEN st.EVENT_NAME LIKE '%DCMAW%' THEN 'App'
        ELSE 'General'
    END) NOT IN (
        SELECT CHANNEL_NAME
        FROM conformed.DIM_JOURNEY_CHANNEL
    );


    ----Insert and update for dim_relying_party 


-- do not chnage the where clause as redshift doesn’t likes it!!!
/*UPDATE conformed.DIM_RELYING_PARTY
SET 
  CLIENT_ID = NVL(st.CLIENT_ID,'-1'),
  RELYING_PARTY_NAME = st.CLIENT_NAME,
  RELYING_PARTY_DESCRIPTION = st.CLIENT_NAME,
    MODIFIED_BY= current_user,
    MODIFIED_DATE=CURRENT_DATE,
    BATCH_ID=0000
FROM (
        select DISTINCT
        mn.CLIENT_ID,
        ref.CLIENT_NAME,
        current_user,
        CURRENT_DATE,
        current_user,
        CURRENT_DATE,
        9999
        FROM conformed.v_stg_ipv_cri_cic mn
        left join  "conformed"."ref_relying_parties" ref
        on mn.CLIENT_ID=ref.CLIENT_ID
) AS st
WHERE  st.CLIENT_NAME=conformed.DIM_RELYING_PARTY.RELYING_PARTY_NAME
and  st.CLIENT_ID IN (
  SELECT CLIENT_ID
  FROM conformed.DIM_RELYING_PARTY
);*/




    INSERT INTO  conformed.DIM_RELYING_PARTY (CLIENT_ID, RELYING_PARTY_NAME, DISPLAY_NAME, CREATED_BY, CREATED_DATE, MODIFIED_BY, MODIFIED_DATE, BATCH_ID)
    SELECT
        NVL(st.CLIENT_ID,'-1') ,
        st.CLIENT_NAME,
        st.DISPLAY_NAME,
        current_user,
        CURRENT_DATE,
        current_user,
        CURRENT_DATE,
        9999
    FROM ( select DISTINCT
            mn.CLIENT_ID ,
            ref.CLIENT_NAME,
            ref.DISPLAY_NAME,
            current_user,
            CURRENT_DATE,
            current_user,
            CURRENT_DATE,
            9999
            FROM conformed.v_stg_ipv_journey_ipv_identity_issued_temp mn
            left join  "dap_txma_reporting_db"."conformed"."ref_relying_parties" ref
            --on mn.CLIENT_ID=ref.CLIENT_ID) AS st
            on NVL(mn.CLIENT_ID,'-1')  = NVL(ref.CLIENT_ID,'-1') ) AS st
    WHERE   NVL(st.CLIENT_ID,'-1')   NOT IN (
            SELECT  NVL(CLIENT_ID,'-1') 
            FROM conformed.DIM_RELYING_PARTY
        );     


    -- DIM_VERIFICATION_ROUTE insert and update

UPDATE conformed.DIM_VERIFICATION_ROUTE
SET 
    VERIFICATION_ROUTE_NAME = st.sub_domain,
    VERIFICATION_SHORT_NAME = st.sub_domain,
    ROUTE_DESCRIPTION = st.DOMAIN,
    MODIFIED_BY= current_user,
    MODIFIED_DATE=CURRENT_DATE,
    BATCH_ID=0000
FROM (
    SELECT DISTINCT DOMAIN, sub_domain
    FROM conformed.v_stg_ipv_journey_ipv_identity_issued_temp
    WHERE sub_domain IN (
        SELECT VERIFICATION_ROUTE_NAME
        FROM conformed.DIM_VERIFICATION_ROUTE
    )
) AS st
WHERE st.sub_domain = conformed.DIM_VERIFICATION_ROUTE.VERIFICATION_ROUTE_NAME;


INSERT INTO conformed.DIM_VERIFICATION_ROUTE ( VERIFICATION_ROUTE_NAME, VERIFICATION_SHORT_NAME, ROUTE_DESCRIPTION, CREATED_BY, CREATED_DATE, MODIFIED_BY, MODIFIED_DATE,BATCH_ID)
SELECT DISTINCT sub_domain, sub_domain, domain,current_user,CURRENT_DATE,current_user, CURRENT_DATE,9999
FROM conformed.v_stg_ipv_journey_ipv_identity_issued_temp
WHERE sub_domain NOT IN (SELECT VERIFICATION_ROUTE_NAME  FROM conformed.DIM_VERIFICATION_ROUTE);  




UPDATE "conformed"."fact_user_journey_event" 
SET 
  REJECTION_REASON=trim(st.REJECTION_REASON,'"')
  ,REASON=trim(st.REASON,'"')
  ,USER_USER_ID=st.user_user_id
  ,user_govuk_signin_journey_id=st.user_govuk_signin_journey_id
  ,COMPONENT_ID=st.COMPONENT_ID
  ,CI_FAIL= DECODE(lower(st.CI_FAIL), 
             'false', '0', 
             'true', '1' 
             )::integer::boolean
  ,HAS_MITIGATIONS=DECODE(lower(st.HAS_MITIGATIONS), 
             'false', '0', 
             'true', '1' 
             )::integer::boolean
  ,LEVEL_OF_CONFIDENCE=trim(st.LEVEL_OF_CONFIDENCE,'"')
  ,NOTIFICATION_TYPE=trim(st.NOTIFICATION_TYPE,'"')
  ,MFA_TYPE=trim(st.MFA_TYPE,'"')
  ,ACCOUNT_RECOVERY=trim(st.ACCOUNT_RECOVERY,'"')
  ,strength_Score=null
  ,successful=null
  ,DRIVING_PERMIT=null
  ,ID_CARD=null
  ,PASSPORT=null
  ,RESIDENCE_PERMIT=null
  ,PREVIOUS_GOVUK_SIGNIN_JOURNEY_ID=null
  ,CHECK_DETAILS_PHOTO_VERIFICATION_PROCESS_LEVEL=null
  ,FAILED_CHECK_DETAILS_BIOMETRIC_VERIFICATION_PROCESS_LEVEL=null
  ,CHECK_DETAILS_BIOMETRIC_VERIFICATION_PROCESS_LEVEL=null
  ,ADDRESSES_ENTERED=trim(st.ADDRESSES_ENTERED ,'"') 
  ,ACTIVITY_HISTORY_SCORE=Null
  ,IDENTITY_FRAUD_SCORE= null
  ,DECISION_SCORE= Null
  ,FAILED_CHECK_DETAILS_KBV_RESPONSE_MODE=Null
  ,FAILED_CHECK_DETAILS_CHECK_METHOD=null
  ,CHECK_DETAILS_KBV_RESPONSE_MODE=null
  ,CHECK_DETAILS_KBV_QUALITY=null
  ,VERIFICATION_SCORE=null
  ,CHECK_DETAILS_CHECK_METHOD=null
  ,Iss=st.Iss
  ,VALIDITY_SCORE=null
  ,"TYPE"=null
  ,is_new_account= null
  ,PROCESSED_DATE=st.PROCESSED_DATE
  ,MODIFIED_BY=current_user
  ,MODIFIED_DATE=CURRENT_DATE
  ,BATCH_ID=0000
FROM (SELECT *
  FROM conformed.v_stg_ipv_journey_ipv_identity_issued_temp
  WHERE EVENT_ID IN (
    SELECT EVENT_ID
    FROM "conformed"."fact_user_journey_event" 
) )AS st
WHERE fact_user_journey_event.EVENT_ID = st.EVENT_ID;


INSERT INTO conformed.FACT_USER_JOURNEY_EVENT (EVENT_KEY,DATE_KEY,verification_route_key,journey_channel_key,relying_party_key,USER_USER_ID,
                        EVENT_ID,EVENT_TIME,user_govuk_signin_journey_id,COMPONENT_ID,EVENT_COUNT,CI_FAIL,HAS_MITIGATIONS,LEVEL_OF_CONFIDENCE, 
                        REJECTION_REASON,REASON,NOTIFICATION_TYPE,MFA_TYPE,ACCOUNT_RECOVERY,FAILED_CHECK_DETAILS_BIOMETRIC_VERIFICATION_PROCESS_LEVEL,
                        CHECK_DETAILS_BIOMETRIC_VERIFICATION_PROCESS_LEVEL,CHECK_DETAILS_PHOTO_VERIFICATION_PROCESS_LEVEL,
                        ADDRESSES_ENTERED,ACTIVITY_HISTORY_SCORE,IDENTITY_FRAUD_SCORE,DECISION_SCORE,
                        FAILED_CHECK_DETAILS_KBV_RESPONSE_MODE,FAILED_CHECK_DETAILS_CHECK_METHOD,CHECK_DETAILS_KBV_RESPONSE_MODE,CHECK_DETAILS_KBV_QUALITY,
                        VERIFICATION_SCORE,CHECK_DETAILS_CHECK_METHOD,Iss,VALIDITY_SCORE,"TYPE",is_new_account, strength_Score,successful,
                        PROCESSED_DATE,DRIVING_PERMIT,ID_CARD,PASSPORT,RESIDENCE_PERMIT,PREVIOUS_GOVUK_SIGNIN_JOURNEY_ID,
                        CREATED_BY, CREATED_DATE, MODIFIED_BY, MODIFIED_DATE, BATCH_ID)
SELECT NVL(DE.event_key,-1) AS event_key
      ,dd.date_key
      ,NVL(dvr.verification_route_key,-1) AS verification_route_key
      , NVL(djc.journey_channel_key,-1) AS journey_channel_key
      , NVL(drp.relying_party_key,-1) AS relying_party_key
      ,user_user_id AS USER_USER_ID
      ,event_id AS EVENT_ID
      --,cnf.event_name
      --,cnf.timestamp AS EVENT_TIME
      ,cnf.timestamp_formatted as EVENT_TIME
      ,cnf.user_govuk_signin_journey_id AS user_govuk_signin_journey_id
      ,cnf.component_id AS COMPONENT_ID
      ,EVENT_COUNT
      , DECODE(lower(CI_FAIL), 
             'false', '0', 
             'true', '1' 
             )::integer::boolean
      ,DECODE(lower(HAS_MITIGATIONS), 
             'false', '0', 
             'true', '1' 
             )::integer::boolean 
     ,trim(LEVEL_OF_CONFIDENCE,'"') 
       ,trim(REJECTION_REASON,'"')
       ,trim(REASON,'"')
       ,trim(NOTIFICATION_TYPE,'"')
       ,trim(MFA_TYPE,'"')
       ,trim(ACCOUNT_RECOVERY,'"')
       --,FAILED_CHECK_DETAILS_BIOMETRIC_VERIFICATION_PROCESS_LEVEL
       ,null FAILED_CHECK_DETAILS_BIOMETRIC_VERIFICATION_PROCESS_LEVEL
       --,CHECK_DETAILS_BIOMETRIC_VERIFICATION_PROCESS_LEVEL
      ,null CHECK_DETAILS_BIOMETRIC_VERIFICATION_PROCESS_LEVEL
      ,null checkdetails_photo_verification_process_level                                      
       --,ADDRESSES_ENTERED
       ,trim(ADDRESSES_ENTERED ,'"') 
       --,ACTIVITY_HISTORY_SCORE
       ,null ACTIVITY_HISTORY_SCORE
       ,null IDENTITY_FRAUD_SCORE
       --,null
       ,null DECISION_SCORE
       --,null
       ,FAILED_CHECK_DETAILS_KBV_RESPONSE_MODE
       --,null
       ,null FAILED_CHECK_DETAILS_CHECK_METHOD
       --,null
       ,CHECK_DETAILS_KBV_RESPONSE_MODEL
       --,null
       ,CHECK_DETAILS_KBV_QUALITY
       --,null
       --,VERIFICATION_SCORE
        ,null VERIFICATION_SCORE
       --,CHECK_DETAILS_CHECK_METHOD
       ,null CHECK_DETAILS_CHECK_METHOD
       ,Iss
       --,VALIDITY_SCORE
       ,null VALIDITY_SCORE
       --,"TYPE"
       ,null "TYPE"
       ,null is_new_account 
       ,null strength_Score
       ,null successful     
       ,PROCESSED_DATE
       ,null restricted_drivingpermit
       ,null restricted_idcard
       ,null restricted_passport
       ,null restricted_residencepermit 
       ,null extensions_previousgovuksigninjourneyid   
       ,current_user
       , CURRENT_DATE
       ,current_user
       , CURRENT_DATE
       , 9999
FROM (SELECT *
  FROM conformed.v_stg_ipv_journey_ipv_identity_issued_temp
  WHERE EVENT_ID NOT IN (
    SELECT EVENT_ID
    FROM conformed.FACT_USER_JOURNEY_EVENT)
    --and event_id='68d7215e-36cc-4f6d-b409-da445bb5f0aa'
    )cnf
JOIN conformed.dim_date dd ON date(cnf.timestamp_formatted)= dd.date
LEFT JOIN conformed.DIM_EVENT DE ON cnf.event_name = DE.EVENT_NAME
LEFT JOIN conformed.dim_journey_channel djc ON 
    (CASE 
        WHEN cnf.EVENT_NAME LIKE '%IPV%' THEN 'Web'
        WHEN cnf.EVENT_NAME LIKE '%DCMAW%' THEN 'App'
        ELSE 'General'
    END) = djc.channel_name
LEFT JOIN conformed.dim_relying_party drp ON 
cnf.CLIENT_ID = drp.CLIENT_ID
LEFT JOIN conformed.dim_verification_route dvr 
     ON  cnf.sub_domain = dvr.verification_route_name;


    INSERT into audit.err_duplicate_event_id_ipv_identity_issued_15 (total_duplicate_event_count_minus_one
    ,product_family,event_name,event_id,timestamp_formatted,created_by,created_datetime)
SELECT event_count,Product_family,event_name,event_id,timestamp_formatted,current_user,GETDATE() as Current_date
    FROM
        (
            SELECT COUNT(*) AS event_count,event_name,auth.Product_family,event_id,timestamp_formatted
            FROM
                (
                    SELECT
                        'ipv_identity_issued' AS Product_family,
                        ROW_NUMBER() OVER (PARTITION BY event_id, timestamp_formatted ORDER BY timestamp_formatted) AS row_num,
                        *
                    FROM
                        "dev_txma_stage"."ipv_journey" 
                        WHERE lower(event_name) in ('ipv_identity_issued')
                        --where event_id='5c94f844-f05d-4c32-87fe-e3b6b265223f'
                ) auth
            JOIN  "conformed"."batchcontrol" batc ON auth.Product_family = batc.product_family
                AND auth.processed_date > batc.maxrundate
            WHERE row_num <> 1
            AND (auth.product_family,event_name, event_id) NOT IN (SELECT product_family ,event_name, event_id 
                                                                        FROM audit.err_duplicate_event_id_ipv_identity_issued_15)
            GROUP BY
                auth.Product_family,
                event_name,
                event_id,
                timestamp_formatted            
        ) subquery; 

  

	raise info 'processing of product family: ipv_journey_ipv_identity_issued ran successfully';

	EXCEPTION WHEN OTHERS THEN 
        RAISE EXCEPTION '[error while processing product family: ipv_journey_ipv_identity_issued] exception: %',sqlerrm;

END;

$$ LANGUAGE plpgsql;    