CREATE OR REPLACE PROCEDURE conformed_refactored.update_event_batch_table()
 LANGUAGE plpgsql
AS $$
BEGIN
    -- Step 1: Clear previous audit logs for this procedure
    DELETE FROM audit_refactored.audit_procedure_status
    WHERE procedure_name = 'update_event_batch_table';

    -- Step 2: Log procedure start
    INSERT INTO audit_refactored.audit_procedure_status (
        step_number,
        procedure_name,
        running_status,
        procedure_start_date
    )
    VALUES (
        8,
        'update_event_batch_table',
        'started',
        GETDATE()
    );

    -- Step 3: Create a temporary table with aggregated max processed timestamp per event
    DROP TABLE IF EXISTS temp_txma_stage_agg;

    CREATE TEMP TABLE temp_txma_stage_agg AS
    SELECT 
        partition_event_name AS event_name,
        MAX(
            TO_TIMESTAMP(
                LEFT(processed_dt, 4) || '-' || 
                SUBSTRING(processed_dt, 5, 2) || '-' || 
                RIGHT(processed_dt, 2) || ' ' || 
                LPAD(LEFT(LPAD(processed_time, 6, '0'), 2), 2, '0') || ':' || 
                LPAD(SUBSTRING(LPAD(processed_time, 6, '0'), 3, 2), 2, '0') || ':' || 
                LPAD(RIGHT(LPAD(processed_time, 6, '0'), 2), 2, '0'),
                'YYYY-MM-DD HH24:MI:SS'
            )
        ) AS new_max_date
    FROM dap_txma_stage.txma_stage_layer
    GROUP BY partition_event_name;

    -- Step 4: Update max_run_date in the batch_events_refactored table
    UPDATE conformed_refactored.batch_events_refactored AS bkp
    SET max_run_date = t.new_max_date
    FROM temp_txma_stage_agg AS t
    WHERE 
        bkp.event_name = t.event_name
        AND t.new_max_date > COALESCE(bkp.max_run_date, TIMESTAMP '1999-01-01 00:00:00')
        AND bkp.event_active = 1;

    -- Step 5: Log procedure completion
    UPDATE audit_refactored.audit_procedure_status
    SET 
        running_status = 'Complete',
        procedure_end_date = GETDATE()
    WHERE procedure_name = 'update_event_batch_table';

END;
$$
