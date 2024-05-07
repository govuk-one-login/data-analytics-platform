CREATE OR REPLACE PROCEDURE conformed_refactored.dim_user_journey_event_upsert()
AS $$
DECLARE
BEGIN
        delete from  audit_refactored.audit_procedure_status
        where Procedure_name='dim_user_journey_event_upsert';
        
        insert into audit_refactored.audit_procedure_status
        (step_number,Procedure_name,running_status,procedure_start_date)
        values(2,'dim_user_journey_event_upsert','started',sysdate);

          UPDATE  conformed_refactored.dim_user_journey_event_refactored
            SET
              user_govuk_signin_journey_id = st.user_govuk_signin_journey_id,
              MODIFIED_BY=current_user,
              MODIFIED_DATE=CURRENT_DATE 
            FROM (
              SELECT distinct stg.user_govuk_signin_journey_id
              FROM  dap_txma_stage.txma_stage_layer  stg
              JOIN  conformed_refactored.batch_events_refactored bth
              ON  stg.partition_event_name=bth.event_name
              WHERE user_govuk_signin_journey_id IN (
                SELECT user_govuk_signin_journey_id
                FROM  conformed_refactored.dim_user_journey_event_refactored
              )
              AND to_date(processed_dt,'YYYYMMDD') >= (SELECT NVL(MIN((max_run_date )),'1999-01-01')
                                                     FROM  conformed_refactored.batch_events_refactored)
              AND bth.event_active =1                                       
            ) AS st
            WHERE dim_user_journey_event_refactored.user_govuk_signin_journey_id = st.user_govuk_signin_journey_id;

            INSERT INTO  conformed_refactored.dim_user_journey_event_refactored 
                        ( user_govuk_signin_journey_id,CREATED_BY, CREATED_DATE, MODIFIED_BY, MODIFIED_DATE)
            SELECT DISTINCT
                stg.user_govuk_signin_journey_id,
                CURRENT_USER,
                CURRENT_DATE,
                CURRENT_USER,
                CURRENT_DATE
            FROM
                dap_txma_stage.txma_stage_layer stg
            JOIN conformed_refactored.batch_events_refactored bth ON stg.partition_event_name = bth.event_name
            LEFT JOIN conformed_refactored.dim_user_journey_event_refactored dim ON stg.user_govuk_signin_journey_id = dim.user_govuk_signin_journey_id
            WHERE TO_DATE(stg.processed_dt, 'YYYYMMDD') >=
                  ( SELECT NVL(MIN((max_run_date )),'1999-01-01')
                    FROM conformed_refactored.batch_events_refactored
                )
            AND bth.event_active = 1
            AND  dim.user_govuk_signin_journey_id is null
            AND stg.user_govuk_signin_journey_id is not null;  
    

        update audit_refactored.audit_procedure_status
        set running_status='Complete'
        ,procedure_end_date=sysdate
        where Procedure_name='dim_user_journey_event_upsert'; 

END;
$$ LANGUAGE plpgsql; 