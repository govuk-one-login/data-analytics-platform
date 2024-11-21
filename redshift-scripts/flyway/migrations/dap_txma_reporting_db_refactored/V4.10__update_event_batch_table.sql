CREATE OR REPLACE PROCEDURE conformed_refactored.update_event_batch_table()
 LANGUAGE plpgsql
AS $$
BEGIN

        delete from  audit_refactored.audit_procedure_status
        where Procedure_name='update_event_batch_table';
        
        insert into audit_refactored.audit_procedure_status
        (step_number,Procedure_name,running_status,procedure_start_date)
        values(8,'update_event_batch_table','started',sysdate);

        UPDATE conformed_refactored.batch_events_refactored AS bkp
        SET max_run_date = COALESCE(
            (
                SELECT MAX(
                    TO_TIMESTAMP(
                        LEFT(processed_dt, 4) || '-' || 
                        SUBSTRING(processed_dt, 5, 2) || '-' || 
                        RIGHT(processed_dt, 2) || ' ' || 
                        LPAD(LEFT(LPAD(processed_time, 6, '0'), 2), 2, '0') || ':' || 
                        LPAD(SUBSTRING(LPAD(processed_time, 6, '0'), 3, 2), 2, '0') || ':' || 
                        LPAD(RIGHT(LPAD(processed_time, 6, '0'), 2), 2, '0'),
                        'YYYY-MM-DD HH24:MI:SS'  -- Format string
                    )
                )
                FROM dap_txma_stage.txma_stage_layer
                WHERE partition_event_name = bkp.event_name 
                    AND TO_TIMESTAMP(
                        LEFT(processed_dt, 4) || '-' || 
                        SUBSTRING(processed_dt, 5, 2) || '-' || 
                        RIGHT(processed_dt, 2) || ' ' || 
                        LPAD(LEFT(LPAD(processed_time, 6, '0'), 2), 2, '0') || ':' || 
                        LPAD(SUBSTRING(LPAD(processed_time, 6, '0'), 3, 2), 2, '0') || ':' || 
                        LPAD(RIGHT(LPAD(processed_time, 6, '0'), 2), 2, '0'),
                        'YYYY-MM-DD HH24:MI:SS'  -- Format string
                    ) >= COALESCE(bkp.max_run_date, '1999-01-01 00:00:00')
            ),
            bkp.max_run_date
        )
        FROM conformed_refactored.batch_events_refactored AS br
        WHERE br.event_active = 1;

        update audit_refactored.audit_procedure_status
        set running_status='Complete'
        ,procedure_end_date=sysdate
        where Procedure_name='update_event_batch_table';      

END;
$$
