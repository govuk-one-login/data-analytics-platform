CREATE OR REPLACE PROCEDURE conformed.sp_ipv_journey()
 LANGUAGE plpgsql
AS $_$
BEGIN
/*
Name       Date         Notes
P Sodhi    15/09/2023   Removed update to the RP table as its not needed.
                        Insert to the RP table slightly modified to include display_name column.
*/
	
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
      FROM conformed.v_stg_ipv_journey
      WHERE EVENT_NAME IN (
        SELECT EVENT_NAME
        FROM conformed.DIM_EVENT
      )
    ) AS st
    WHERE DIM_EVENT.EVENT_NAME = st.event_name;


    INSERT INTO conformed.DIM_EVENT ( EVENT_NAME, EVENT_DESCRIPTION, PRODUCT_FAMILY ,EVENT_JOURNEY_TYPE, SERVICE_NAME, CREATED_BY, CREATED_DATE, MODIFIED_BY, MODIFIED_DATE,BATCH_ID)
    SELECT DISTINCT EVENT_NAME, EVENT_NAME, REF_PRODUCT_FAMILY ,domain, sub_domain,current_user,CURRENT_DATE,current_user, CURRENT_DATE,9999
    FROM conformed.v_stg_ipv_journey
    WHERE EVENT_NAME NOT IN (SELECT EVENT_NAME FROM conformed.DIM_EVENT);

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
      FROM conformed.v_stg_ipv_journey
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
    FROM conformed.v_stg_ipv_journey AS st
    WHERE (CASE
            WHEN st.EVENT_NAME LIKE '%IPV%' THEN 'Web'
            WHEN st.EVENT_NAME LIKE '%DCMAW%' THEN 'App'
            ELSE 'General'
        END) NOT IN (
            SELECT CHANNEL_NAME
            FROM conformed.DIM_JOURNEY_CHANNEL
        );

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
            FROM conformed.v_stg_ipv_journey mn
            left join  "dap_txma_reporting_db"."conformed"."ref_relying_parties" ref
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
            FROM conformed.v_stg_ipv_journey mn
            left join  "dap_txma_reporting_db"."conformed"."ref_relying_parties" ref
            --on mn.CLIENT_ID=ref.CLIENT_ID) AS st
            on NVL(mn.CLIENT_ID,'-1')  = NVL(ref.CLIENT_ID,'-1') ) AS st
    WHERE   NVL(st.CLIENT_ID,'-1')   NOT IN (
            SELECT  NVL(CLIENT_ID,'-1') 
            FROM conformed.DIM_RELYING_PARTY
        );


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
        FROM conformed.v_stg_ipv_journey
        WHERE sub_domain IN (
            SELECT VERIFICATION_ROUTE_NAME
            FROM conformed.DIM_VERIFICATION_ROUTE
        )
    ) AS st
    WHERE st.sub_domain = conformed.DIM_VERIFICATION_ROUTE.VERIFICATION_ROUTE_NAME;


    INSERT INTO conformed.DIM_VERIFICATION_ROUTE ( VERIFICATION_ROUTE_NAME, VERIFICATION_SHORT_NAME, ROUTE_DESCRIPTION, CREATED_BY, CREATED_DATE, MODIFIED_BY, MODIFIED_DATE,BATCH_ID)
    SELECT DISTINCT sub_domain, sub_domain, domain,current_user,CURRENT_DATE,current_user, CURRENT_DATE,9999
    FROM conformed.v_stg_ipv_journey
    WHERE sub_domain NOT IN (SELECT VERIFICATION_ROUTE_NAME  FROM conformed.DIM_VERIFICATION_ROUTE);


    UPDATE  "conformed"."fact_user_journey_event"
    SET
       REJECTION_REASON=trim(st.REJECTION_REASON,'"')
      ,REASON=trim(st.REASON,'"')
      ,USER_USER_ID=st.user_user_id
      ,USER_GOVUK_SIGNIN_JOURNEY_ID=st.user_govuk_signin_journey_id
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
      ,FAILED_CHECK_DETAILS_BIOMETRIC_VERIFICATION_PROCESS_LEVEL=--st.FAILED_CHECK_DETAILS_BIOMETRIC_VERIFICATION_PROCESS_LEVEL
                                        trim(CASE when JSON_SERIALIZE(st.FAILED_CHECK_DETAILS_BIOMETRIC_VERIFICATION_PROCESS_LEVEL)='null'
                                                                            then NULL
                                                                            ELSE
                                                                        JSON_SERIALIZE(st.FAILED_CHECK_DETAILS_BIOMETRIC_VERIFICATION_PROCESS_LEVEL) 
                                                                            END ,'"')
      ,CHECK_DETAILS_BIOMETRIC_VERIFICATION_PROCESS_LEVEL=--st.CHECK_DETAILS_BIOMETRIC_VERIFICATION_PROCESS_LEVEL
                                                        trim(CASE when JSON_SERIALIZE(st.CHECK_DETAILS_BIOMETRIC_VERIFICATION_PROCESS_LEVEL)='null'
                                                                            then NULL
                                                                            ELSE
                                                                            JSON_SERIALIZE(st.CHECK_DETAILS_BIOMETRIC_VERIFICATION_PROCESS_LEVEL) 
                                                                            END ,'"')
      ,ADDRESSES_ENTERED=trim(st.ADDRESSES_ENTERED ,'"') 
      ,ACTIVITY_HISTORY_SCORE=--CAST(st.ACTIVITY_HISTORY_SCORE AS INTEGER)
                              CAST(case when trim(JSON_SERIALIZE(st.ACTIVITY_HISTORY_SCORE),'"') ~ '^[0-9]+$' 
                              then trim(JSON_SERIALIZE(st.ACTIVITY_HISTORY_SCORE),'"')
                              else null
                          end AS INTEGER)
      ,IDENTITY_FRAUD_SCORE=--CAST(st.IDENTITY_FRAUD_SCORE AS INTEGER)
                            CAST(case when trim(JSON_SERIALIZE(st.IDENTITY_FRAUD_SCORE),'"') ~ '^[0-9]+$' 
                            then trim(JSON_SERIALIZE(st.IDENTITY_FRAUD_SCORE),'"') 
                              else null
                          end AS INTEGER)
      ,DECISION_SCORE=--CAST(st.DECISION_SCORE AS INTEGER)
                      CAST(case when trim(st.DECISION_SCORE,'"') ~ '^[0-9]+$' then trim(st.DECISION_SCORE,'"') 
                              else null
                          end AS INTEGER)
      ,FAILED_CHECK_DETAILS_KBV_RESPONSE_MODE=--st.FAILED_CHECK_DETAILS_KBV_RESPONSE_MODE
                                        trim(CASE when JSON_SERIALIZE(st.FAILED_CHECK_DETAILS_KBV_RESPONSE_MODE)='null'
                                        then NULL
                                        ELSE
                                            JSON_SERIALIZE(st.FAILED_CHECK_DETAILS_KBV_RESPONSE_MODE) 
                                        END,'"') 
      ,FAILED_CHECK_DETAILS_CHECK_METHOD=--st.FAILED_CHECK_DETAILS_CHECK_METHOD
                                        trim(CASE when JSON_SERIALIZE(st.FAILED_CHECK_DETAILS_CHECK_METHOD)='null'
                                        then NULL
                                        ELSE
                                            JSON_SERIALIZE(st.FAILED_CHECK_DETAILS_CHECK_METHOD)
                                        END ,'"')
      ,CHECK_DETAILS_KBV_RESPONSE_MODE=--trim(st.CHECK_DETAILS_KBV_RESPONSE_MODEL,'"') 
                                      trim(CASE when JSON_SERIALIZE(st.CHECK_DETAILS_KBV_RESPONSE_MODE)='null'
                                        then NULL
                                        ELSE
                                            JSON_SERIALIZE(st.CHECK_DETAILS_KBV_RESPONSE_MODE) 
                                        END ,'"')
      ,CHECK_DETAILS_KBV_QUALITY=--trim(st.CHECK_DETAILS_KBV_QUALITY ,'"') 
                                trim(CASE when JSON_SERIALIZE(st.CHECK_DETAILS_KBV_QUALITY)='null'
                                        then NULL
                                        ELSE
                                            JSON_SERIALIZE(st.CHECK_DETAILS_KBV_QUALITY) 
                                        END ,'"')
      ,VERIFICATION_SCORE=--CAST(st.VERIFICATION_SCORE AS INTEGER)
                             CAST(case when trim(JSON_SERIALIZE(st.VERIFICATION_SCORE),'"') ~ '^[0-9]+$' 
                                       then trim(JSON_SERIALIZE(st.VERIFICATION_SCORE),'"')
                                              else null
                                          end AS INTEGER)
      ,CHECK_DETAILS_CHECK_METHOD=--st.CHECK_DETAILS_CHECK_METHOD
                                trim(CASE when  JSON_SERIALIZE(st.CHECK_DETAILS_CHECK_METHOD)='null'
                                        then NULL
                                        ELSE
                                             JSON_SERIALIZE(st.CHECK_DETAILS_CHECK_METHOD)
                                        END,'"') 
      ,Iss=st.Iss
      ,VALIDITY_SCORE=--CAST(st.VALIDITY_SCORE AS INTEGER)
                      CAST(case when trim(JSON_SERIALIZE(st.VALIDITY_SCORE),'"') ~ '^[0-9]+$' 
                                then trim(JSON_SERIALIZE(st.VALIDITY_SCORE),'"')
                                              else null
                                          end AS INTEGER)
      ,"TYPE"=--st."TYPE"
      trim(CASE when JSON_SERIALIZE(st."TYPE") ='null'
                                        then NULL
                                        ELSE
                                            JSON_SERIALIZE(st."TYPE")
                                        END ,'"')
      ,successful=trim(CASE when  st.extensions_successful ='null'
                                        then NULL
                                        ELSE
                                             st.extensions_successful
                                        END ,'"')
      ,strength_score=CAST(case when trim( JSON_SERIALIZE(st.strength_score),'"') ~ '^[0-9]+$' 
                                then trim( JSON_SERIALIZE(st.strength_score),'"')
                                             else null
                                         end AS INTEGER)  
      ,gpg45_Activity_Score=CAST(case when trim(st.gpg45_Activity_Score,'"') ~ '^[0-9]+$' then trim(st.gpg45_Activity_Score,'"')
                                              else null
                                         end AS INTEGER) 
      ,gpg45_evidences_Strength_Score
                            =CAST(case when trim(st.gpg45_strength_score,'"') ~ '^[0-9]+$' then trim(st.gpg45_strength_score,'"')
                                             else null
                                         end AS INTEGER) 
      ,gpg45_evidence_Validity_Score
                                =CAST(case when trim(st.gpg45_validity_score,'"') ~ '^[0-9]+$' then trim(st.gpg45_validity_score,'"')
                                             else null
                                         end AS INTEGER) 
      ,gpg45_Fraud_Score=CAST(case when trim(st.gpg45_Fraud_Score,'"') ~ '^[0-9]+$' then trim(st.gpg45_Fraud_Score,'"')
                                              else null
                                          end AS INTEGER) 
      ,gpg45_Verification_Score=CAST(case when trim(st.gpg45_Verification_Score,'"') ~ '^[0-9]+$' then trim(st.gpg45_Verification_Score,'"')
                                              else null
                                         end AS INTEGER) 
      ,nationality_is_UK_Issued= DECODE(lower(st.extensions_isukissued), 
                    'false', '0', 
                    'true', '1' 
                    )::integer::boolean
      ,age
                                =CAST(case when trim(st.extensions_age,'"') ~ '^[0-9]+$' then trim(st.extensions_age,'"')
                                             else null
                                         end AS INTEGER) 
      ,reprove_identity = DECODE(lower(st.extensions_reproveidentity), 
                    'false', '0', 
                    'true', '1' 
                    )::integer::boolean 
      ,event_timestamp_ms=st.event_timestamp_ms
      ,event_timestamp_ms_formatted=st.event_timestamp_ms_formatted
      ,mitigation_type=st.extensions_mitigationtype                                             
      ,PROCESSED_DATE=st.PROCESSED_DATE
      ,MODIFIED_BY=current_user
      ,MODIFIED_DATE=CURRENT_DATE
      ,BATCH_ID=0000
    FROM (SELECT *
      FROM conformed.v_stg_ipv_journey
      WHERE EVENT_ID IN (
        SELECT EVENT_ID
        FROM  "conformed"."fact_user_journey_event"
        --where event_id='7a371bbc-5ac3-4463-b78d-8960cb47f495'
    ) )AS st
    WHERE fact_user_journey_event.EVENT_ID = st.EVENT_ID;


   INSERT INTO conformed.FACT_USER_JOURNEY_EVENT (EVENT_KEY,DATE_KEY,verification_route_key,journey_channel_key,relying_party_key,USER_USER_ID,
                            EVENT_ID,EVENT_TIME,USER_GOVUK_SIGNIN_JOURNEY_ID,COMPONENT_ID,EVENT_COUNT,CI_FAIL,HAS_MITIGATIONS,LEVEL_OF_CONFIDENCE, 
                            REJECTION_REASON,REASON,NOTIFICATION_TYPE,MFA_TYPE,ACCOUNT_RECOVERY,FAILED_CHECK_DETAILS_BIOMETRIC_VERIFICATION_PROCESS_LEVEL
                            ,
                            CHECK_DETAILS_BIOMETRIC_VERIFICATION_PROCESS_LEVEL,ADDRESSES_ENTERED,ACTIVITY_HISTORY_SCORE,IDENTITY_FRAUD_SCORE,
                            DECISION_SCORE,
                            FAILED_CHECK_DETAILS_KBV_RESPONSE_MODE,FAILED_CHECK_DETAILS_CHECK_METHOD,CHECK_DETAILS_KBV_RESPONSE_MODE,CHECK_DETAILS_KBV_QUALITY,
                            VERIFICATION_SCORE,CHECK_DETAILS_CHECK_METHOD,Iss,VALIDITY_SCORE,"TYPE",successful,strength_score,gpg45_Activity_Score,
                            gpg45_evidences_Strength_Score,gpg45_evidence_Validity_Score,gpg45_Fraud_Score,gpg45_Verification_Score,nationality_is_UK_Issued,Age,
                            reprove_identity,event_timestamp_ms,event_timestamp_ms_formatted,mitigation_type,PROCESSED_DATE,CREATED_BY, CREATED_DATE, MODIFIED_BY, MODIFIED_DATE, BATCH_ID)
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
          ,cnf.user_govuk_signin_journey_id AS USER_GOVUK_SIGNIN_JOURNEY_ID
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
           ,trim(CASE when JSON_SERIALIZE(FAILED_CHECK_DETAILS_BIOMETRIC_VERIFICATION_PROCESS_LEVEL)='null'
                                                                            then NULL
                                                                            ELSE
                                                                        JSON_SERIALIZE(FAILED_CHECK_DETAILS_BIOMETRIC_VERIFICATION_PROCESS_LEVEL) 
                                                                            END ,'"')
           --,CHECK_DETAILS_BIOMETRIC_VERIFICATION_PROCESS_LEVEL
           ,trim(CASE when JSON_SERIALIZE(CHECK_DETAILS_BIOMETRIC_VERIFICATION_PROCESS_LEVEL)='null'
                                                                            then NULL
                                                                            ELSE
                                                                            JSON_SERIALIZE(CHECK_DETAILS_BIOMETRIC_VERIFICATION_PROCESS_LEVEL) 
                                                                            END ,'"')
           ,trim(ADDRESSES_ENTERED ,'"') 
           --,CAST(ACTIVITY_HISTORY_SCORE AS INTEGER)
           ,CAST(case when trim(JSON_SERIALIZE(ACTIVITY_HISTORY_SCORE),'"') ~ '^[0-9]+$' 
                              then trim(JSON_SERIALIZE(ACTIVITY_HISTORY_SCORE),'"')
                              else null
                          end AS INTEGER)
           --,CAST(IDENTITY_FRAUD_SCORE AS INTEGER)
           ,CAST(case when trim(JSON_SERIALIZE(IDENTITY_FRAUD_SCORE),'"') ~ '^[0-9]+$' 
                            then trim(JSON_SERIALIZE(IDENTITY_FRAUD_SCORE),'"') 
                              else null
                          end AS INTEGER)
           --,CAST(DECISION_SCORE AS INTEGER)
           ,CAST(case when trim(DECISION_SCORE,'"') ~ '^[0-9]+$' then trim(DECISION_SCORE,'"') 
                              else null
                          end AS INTEGER)
           --,FAILED_CHECK_DETAILS_KBV_RESPONSE_MODE
           ,trim(CASE when JSON_SERIALIZE(FAILED_CHECK_DETAILS_KBV_RESPONSE_MODE)='null'
                                        then NULL
                                        ELSE
                                            JSON_SERIALIZE(FAILED_CHECK_DETAILS_KBV_RESPONSE_MODE) 
                                        END,'"') 
           --,FAILED_CHECK_DETAILS_CHECK_METHOD
           ,trim(CASE when JSON_SERIALIZE(FAILED_CHECK_DETAILS_CHECK_METHOD)='null'
                                        then NULL
                                        ELSE
                                            JSON_SERIALIZE(FAILED_CHECK_DETAILS_CHECK_METHOD)
                                        END ,'"')
          -- ,trim(CHECK_DETAILS_KBV_RESPONSE_MODEL ,'"') 
           ,trim(CASE when JSON_SERIALIZE(CHECK_DETAILS_KBV_RESPONSE_MODE)='null'
                                        then NULL
                                        ELSE
                                            JSON_SERIALIZE(CHECK_DETAILS_KBV_RESPONSE_MODE) 
                                        END ,'"')
           --,trim(CHECK_DETAILS_KBV_QUALITY ,'"') 
           ,trim(CASE when JSON_SERIALIZE(CHECK_DETAILS_KBV_QUALITY)='null'
                                        then NULL
                                        ELSE
                                            JSON_SERIALIZE(CHECK_DETAILS_KBV_QUALITY) 
                                        END ,'"')
           --,CAST(VERIFICATION_SCORE AS INTEGER)
           ,CAST(case when trim(JSON_SERIALIZE(VERIFICATION_SCORE),'"') ~ '^[0-9]+$' 
                                       then trim(JSON_SERIALIZE(VERIFICATION_SCORE),'"')
                                              else null
                                          end AS INTEGER)
           --,CHECK_DETAILS_CHECK_METHOD
           ,trim(CASE when  JSON_SERIALIZE(CHECK_DETAILS_CHECK_METHOD)='null'
                                        then NULL
                                        ELSE
                                             JSON_SERIALIZE(CHECK_DETAILS_CHECK_METHOD)
                                        END,'"') 
           ,Iss
           --,CAST(VALIDITY_SCORE AS INTEGER)
           ,CAST(case when trim(JSON_SERIALIZE(VALIDITY_SCORE),'"') ~ '^[0-9]+$' 
                                then trim(JSON_SERIALIZE(VALIDITY_SCORE),'"')
                                              else null
                                          end AS INTEGER)
           --,"TYPE"
           , trim(CASE when JSON_SERIALIZE("TYPE") ='null'
                                        then NULL
                                        ELSE
                                            JSON_SERIALIZE("TYPE")
                                        END ,'"')
            ,trim(CASE when  extensions_successful ='null'
                                        then NULL
                                        ELSE
                                             extensions_successful
                                        END ,'"') 
            ,CAST(case when trim( JSON_SERIALIZE(strength_score),'"') ~ '^[0-9]+$' 
                                then trim( JSON_SERIALIZE(strength_score),'"')
                                             else null
                                         end AS INTEGER) 
            ,CAST(case when trim(gpg45_Activity_Score,'"') ~ '^[0-9]+$' then trim(gpg45_Activity_Score,'"')
                                              else null end 
                                              AS        INTEGER) 
            ,CAST(case when trim(gpg45_strength_score,'"') ~ '^[0-9]+$' then trim(gpg45_strength_score,'"')
                                             else null
                                         end AS INTEGER)
            , CAST(case when trim(gpg45_validity_score,'"') ~ '^[0-9]+$' then trim(gpg45_validity_score,'"')
                                             else null
                                         end AS INTEGER)   
            ,CAST(case when trim(gpg45_Fraud_Score,'"') ~ '^[0-9]+$' then trim(gpg45_Fraud_Score,'"')
                                              else null
                                          end AS INTEGER)    
            , CAST(case when trim(gpg45_Verification_Score,'"') ~ '^[0-9]+$' then trim(gpg45_Verification_Score,'"')
                                              else null
                                         end AS INTEGER)   
             ,DECODE(lower(extensions_isukissued), 
             'false', '0', 
             'true', '1' 
             )::integer::boolean
             , CAST(case when trim(extensions_age,'"') ~ '^[0-9]+$' then trim(extensions_age,'"')
                                              else null
                                         end AS INTEGER)   
             ,DECODE(lower(extensions_reproveidentity), 
             'false', '0', 
             'true', '1' 
             )::integer::boolean  
             ,event_timestamp_ms
             ,event_timestamp_ms_formatted
             ,extensions_mitigationtype                         
         ,PROCESSED_DATE
           ,current_user
           , CURRENT_DATE
           ,current_user
           , CURRENT_DATE
           , 9999
    FROM (SELECT *
      FROM conformed.v_stg_ipv_journey
      --WHERE event_id='7a371bbc-5ac3-4463-b78d-8960cb47f495' 
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
                        'ipv_journey' AS Product_family,
                        ROW_NUMBER() OVER (PARTITION BY event_id, timestamp_formatted ORDER BY timestamp_formatted) AS row_num,
                        *
                    FROM
                         "dap_txma_stage"."ipv_journey" 
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


    UPDATE conformed.BatchControl
    SET MaxRunDate = CAST(subquery.updated_value AS DATE)
    FROM (
      SELECT PRODUCT_FAMILY, MAX(PROCESSED_DATE) updated_value
      FROM conformed.v_stg_ipv_journey
      GROUP BY PRODUCT_FAMILY
    ) AS subquery
    WHERE conformed.BatchControl.Product_family =subquery.PRODUCT_FAMILY;

	raise info 'processing of product family: sp_ipv_journey ran successfully';

	EXCEPTION WHEN OTHERS THEN 
        RAISE EXCEPTION '[error while processing product family: sp_ipv_journey] exception: %',sqlerrm;

END;

$_$
