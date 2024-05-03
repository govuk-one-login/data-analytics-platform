CREATE OR REPLACE PROCEDURE conformed_refactored.fact_user_journey_event_refactored_upsert()
AS $$
DECLARE
BEGIN

        delete from  audit_refactored.audit_procedure_status
        where Procedure_name='fact_user_journey_event_refactored_upsert';
        
        insert into audit_refactored.audit_procedure_status
        (step_number,Procedure_name,running_status,procedure_start_date)
        values(6,'fact_user_journey_event_refactored_upsert','started',sysdate);

INSERT INTO conformed_refactored.FACT_USER_JOURNEY_EVENT_refactored ( EVENT_KEY,DATE_KEY,JOURNEY_CHANNEL_KEY,relying_party_key, USER_JOURNEY_KEY,USER_KEY,
                                                EVENT_ID,EVENT_TIME,COMPONENT_ID,event_count,PROCESSED_DATE,
                                                CREATED_BY, CREATED_DATE, MODIFIED_BY, MODIFIED_DATE)
SELECT NVL(DE.event_key,-1) AS event_key
          ,dd.date_key
          , NVL(djc.journey_channel_key,-1) AS journey_channel_key
          , NVL(drp.relying_party_key,-1) AS relying_party_key
          ,NVL(DUE.user_journey_key,-1) AS user_journey_key
          ,NVL(DU.user_key,-1) AS user_key
          ,event_id AS EVENT_ID
          ,cnf.timestamp_formatted as EVENT_TIME
          ,cnf.component_id AS COMPONENT_ID
          ,1 EVENT_COUNT
          ,to_date(processed_dt,'YYYYMMDD') 
           ,current_user
           , CURRENT_DATE
           ,current_user
           , CURRENT_DATE
    FROM  (SELECT timestamp_formatted,component_id,stg.partition_event_name,client_id,stg.user_user_id
           ,stg.user_govuk_signin_journey_id,stg.event_id,processed_dt
      FROM  (SELECT * FROM
             (SELECT timestamp_formatted,component_id,partition_event_name ,client_id,user_user_id
              ,user_govuk_signin_journey_id,event_id,processed_dt,
              row_number()over(partition by partition_event_name,event_id order by processed_dt,timestamp) row_nm
              FROM  dap_txma_stage.txma_stage_layer
              --where  event_id='6860e029-d0e8-4267-b36d-dc66447707d6' 
              )
              WHERE row_nm=1) stg
              JOIN  conformed_refactored.batch_events_refactored bth
              ON  stg.partition_event_name=bth.event_name 
      WHERE EVENT_ID NOT IN (
        SELECT EVENT_ID
        FROM conformed_refactored.FACT_USER_JOURNEY_EVENT_refactored)
        AND to_date(processed_dt,'YYYYMMDD') >= (SELECT NVL(MIN((max_run_date )),'1999-01-01')
                                                     FROM conformed_refactored.batch_events_refactored)
        AND bth.event_active =1                                                     
        )cnf
    JOIN conformed_refactored.dim_date_refactored dd ON date(cnf.timestamp_formatted)= dd.date
    LEFT JOIN conformed_refactored.DIM_EVENT_refactored DE ON cnf.partition_event_name = DE.EVENT_NAME
    LEFT JOIN conformed_refactored.dim_journey_channel_refactored djc ON
        (CASE
            WHEN cnf.partition_event_name LIKE '%IPV%' THEN 'Web'
            WHEN cnf.partition_event_name LIKE '%DCMAW%' THEN 'App'
            ELSE 'General'
        END) = djc.channel_name
    LEFT JOIN conformed_refactored.dim_relying_party_refactored drp ON cnf.CLIENT_ID = drp.CLIENT_ID 
    LEFT JOIN conformed_refactored.dim_user_refactored DU ON cnf.user_user_id = DU.user_id
    LEFT JOIN conformed_refactored.dim_user_journey_event_refactored DUE ON cnf.user_govuk_signin_journey_id = DUE.user_govuk_signin_journey_id ;
    
    UPDATE  conformed_refactored.FACT_USER_JOURNEY_EVENT_refactored
    SET
       COMPONENT_ID=st.COMPONENT_ID     
      ,PROCESSED_DATE=to_date(st.processed_dt,'YYYYMMDD')
      ,MODIFIED_BY=current_user
      ,MODIFIED_DATE=CURRENT_DATE
    FROM (SELECT *
      FROM  (SELECT * FROM
             (SELECT timestamp_formatted,component_id,partition_event_name,client_id,user_user_id
              ,user_govuk_signin_journey_id,event_id,processed_dt,
              row_number()over(partition by event_name,event_id order by processed_dt,timestamp) row_nm
              FROM  dap_txma_stage.txma_stage_layer)
              WHERE row_nm=1) stg
              JOIN  conformed_refactored.batch_events_refactored bth
              ON  stg.partition_event_name=bth.event_name
      WHERE EVENT_ID IN (
        SELECT EVENT_ID
        FROM  conformed_refactored.fact_user_journey_event_refactored 
    )
    AND to_date(processed_dt,'YYYYMMDD') >= (SELECT NVL(MIN((max_run_date )),'1999-01-01')
                                                     FROM  conformed_refactored.batch_events_refactored) 
    AND bth.event_active =1                                                     
    )AS st
    WHERE fact_user_journey_event_refactored.EVENT_ID = st.EVENT_ID
    and fact_user_journey_event_refactored.COMPONENT_ID<>st.COMPONENT_ID ;

        update audit_refactored.audit_procedure_status
        set running_status='Complete'
        ,procedure_end_date=sysdate
        where Procedure_name='fact_user_journey_event_refactored_upsert'; 

    END;
$$ LANGUAGE plpgsql; 