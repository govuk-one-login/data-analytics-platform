CREATE OR REPLACE PROCEDURE conformed_refactored.update_event_batch_table()
AS $$
BEGIN

        delete from  audit_refactored.audit_procedure_status
        where Procedure_name='update_event_batch_table';
        
        insert into audit_refactored.audit_procedure_status
        (step_number,Procedure_name,running_status,procedure_start_date)
        values(8,'update_event_batch_table','started',sysdate);

    UPDATE conformed_refactored.batch_events_refactored b
    SET max_run_date = NVL((
        SELECT MAX(TO_DATE(processed_dt, 'YYYYMMDD'))
        FROM dap_txma_stage.txma_stage_layer
        WHERE partition_event_name = b.event_name 
            AND TO_DATE(processed_dt, 'YYYYMMDD') >= COALESCE(b.max_run_date, '1999-01-01'::DATE)
    ),max_run_date)
    FROM conformed_refactored.batch_events_refactored b
    WHERE b.event_active =1;

        update audit_refactored.audit_procedure_status
        set running_status='Complete'
        ,procedure_end_date=sysdate
        where Procedure_name='update_event_batch_table';      

END;
$$ LANGUAGE plpgsql;