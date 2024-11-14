CREATE OR REPLACE PROCEDURE conformed_refactored.dim_event_upsert()
 LANGUAGE plpgsql
AS $$
DECLARE
BEGIN
        delete from  audit_refactored.audit_procedure_status
        where Procedure_name='dim_event_upsert';
        
        insert into audit_refactored.audit_procedure_status
        (step_number,Procedure_name,running_status,procedure_start_date)
        values(1,'dim_event_upsert','started',sysdate);

          UPDATE  conformed_refactored.dim_event_refactored
            SET
              EVENT_NAME = st.partition_event_name,
              MODIFIED_BY=current_user,
              MODIFIED_DATE=CURRENT_DATE 
            FROM (
              SELECT distinct stg.partition_event_name
              FROM dap_txma_stage.txma_stage_layer stg
              JOIN conformed_refactored.batch_events_refactored bth
              ON  stg.partition_event_name=bth.event_name
              WHERE partition_event_name IN (
                SELECT event_name
                FROM  conformed_refactored.dim_event_refactored
              )
              AND 
                    TO_TIMESTAMP(
                        LEFT(processed_dt, 4) || '-' || 
                        SUBSTRING(processed_dt, 5, 2) || '-' || 
                        RIGHT(processed_dt, 2) || ' ' || 
                        LPAD(LEFT(LPAD(processed_time, 6, '0'), 2), 2, '0') || ':' || 
                        LPAD(SUBSTRING(LPAD(processed_time, 6, '0'), 3, 2), 2, '0') || ':' || 
                        LPAD(RIGHT(LPAD(processed_time, 6, '0'), 2), 2, '0'),
                        'YYYY-MM-DD HH24:MI:SS'  -- Format string
                    )
                 >= (SELECT NVL(MIN((max_run_date )),'1999-01-01 00:00:00')
                                                     FROM  conformed_refactored.batch_events_refactored)
              AND bth.event_active =1
            ) AS st
            WHERE dim_event_refactored.EVENT_NAME = st.partition_event_name;

            INSERT INTO  conformed_refactored.dim_event_refactored 
            ( EVENT_NAME,CREATED_BY, CREATED_DATE, MODIFIED_BY, MODIFIED_DATE)
            SELECT DISTINCT stg.partition_event_name,current_user,CURRENT_DATE,current_user, CURRENT_DATE
            FROM dap_txma_stage.txma_stage_layer stg
            JOIN  conformed_refactored.batch_events_refactored bth
            on stg.partition_event_name=bth.event_name
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
            AND partition_event_name NOT IN (SELECT EVENT_NAME FROM  conformed_refactored.dim_event_refactored);

        update audit_refactored.audit_procedure_status
        set running_status='Complete'
        ,procedure_end_date=sysdate
        where Procedure_name='dim_event_upsert'; 


END;
$$
