CREATE OR REPLACE PROCEDURE conformed_refactored.dim_journey_channel_refactored_upsert()
 LANGUAGE plpgsql
AS $$
DECLARE
BEGIN

        delete from  audit_refactored.audit_procedure_status
        where Procedure_name='dim_journey_channel_refactored_upsert';
        
        insert into audit_refactored.audit_procedure_status
        (step_number,Procedure_name,running_status,procedure_start_date)
        values(4,'dim_journey_channel_refactored_upsert','started',sysdate);

UPDATE conformed_refactored.dim_journey_channel_refactored
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
      MODIFIED_DATE=CURRENT_DATE 
    FROM (
      SELECT DISTINCT stg.EVENT_NAME
      FROM  dap_txma_stage.txma_stage_layer stg
              JOIN  conformed_refactored.batch_events_refactored bth
              ON  stg.partition_event_name=bth.event_name
      WHERE TO_TIMESTAMP(
                        LEFT(processed_dt, 4) || '-' || 
                        SUBSTRING(processed_dt, 5, 2) || '-' || 
                        RIGHT(processed_dt, 2) || ' ' || 
                        LPAD(LEFT(LPAD(processed_time, 6, '0'), 2), 2, '0') || ':' || 
                        LPAD(SUBSTRING(LPAD(processed_time, 6, '0'), 3, 2), 2, '0') || ':' || 
                        LPAD(RIGHT(LPAD(processed_time, 6, '0'), 2), 2, '0'),
                        'YYYY-MM-DD HH24:MI:SS'  -- Format string
                    )  >= (SELECT NVL(MIN((max_run_date )),'1999-01-01 00:00:00')
                                                     FROM  conformed_refactored.batch_events_refactored)
      AND bth.event_active =1                                                     
    ) AS st
    WHERE (
      CASE
        WHEN st.EVENT_NAME LIKE '%IPV%' THEN 'Web'
        WHEN st.EVENT_NAME LIKE '%DCMAW%' THEN 'App'
        ELSE 'General'
      END
    ) = conformed_refactored.dim_journey_channel_refactored.CHANNEL_NAME
    AND (
      CASE
        WHEN st.EVENT_NAME LIKE '%IPV%' THEN 'Web'
        WHEN st.EVENT_NAME LIKE '%DCMAW%' THEN 'App'
        ELSE 'General'
      END
    ) IN (
      SELECT CHANNEL_NAME
      FROM conformed_refactored.dim_journey_channel_refactored
    );


    INSERT INTO conformed_refactored.dim_journey_channel_refactored (CHANNEL_NAME, CHANNEL_DESCRIPTION, CREATED_BY, CREATED_DATE, MODIFIED_BY, MODIFIED_DATE)
    SELECT DISTINCT CASE
            WHEN st.EVENT_NAME LIKE '%IPV%' THEN 'Web'
            WHEN st.EVENT_NAME LIKE '%DCMAW%' THEN 'App'
            ELSE 'General'
        END,
        CASE
            WHEN st.EVENT_NAME LIKE '%IPV%' THEN 'Event has taken place via Web channel'
            WHEN st.EVENT_NAME LIKE '%DCMAW%' THEN 'Event has taken place via App channel'
            ELSE 'General - This is the default channel'
        END,
        current_user,
        CURRENT_DATE,
        current_user,
        CURRENT_DATE 
    FROM  dap_txma_stage.txma_stage_layer AS st
    JOIN conformed_refactored.batch_events_refactored bth
    ON  st.partition_event_name=bth.event_name
    WHERE TO_TIMESTAMP(
                        LEFT(processed_dt, 4) || '-' || 
                        SUBSTRING(processed_dt, 5, 2) || '-' || 
                        RIGHT(processed_dt, 2) || ' ' || 
                        LPAD(LEFT(LPAD(processed_time, 6, '0'), 2), 2, '0') || ':' || 
                        LPAD(SUBSTRING(LPAD(processed_time, 6, '0'), 3, 2), 2, '0') || ':' || 
                        LPAD(RIGHT(LPAD(processed_time, 6, '0'), 2), 2, '0'),
                        'YYYY-MM-DD HH24:MI:SS'  -- Format string
                    )  >= (SELECT NVL(MIN((max_run_date )),'1999-01-01 00:00:00')
                                                     FROM  conformed_refactored.batch_events_refactored)
    AND bth.event_active =1                                                     
    AND (CASE
            WHEN st.EVENT_NAME LIKE '%IPV%' THEN 'Web'
            WHEN st.EVENT_NAME LIKE '%DCMAW%' THEN 'App'
            ELSE 'General'
        END) NOT IN (
            SELECT CHANNEL_NAME
            FROM conformed_refactored.dim_journey_channel_refactored
        );

        update audit_refactored.audit_procedure_status
        set running_status='Complete'
        ,procedure_end_date=sysdate
        where Procedure_name='dim_journey_channel_refactored_upsert';   

END;
$$
