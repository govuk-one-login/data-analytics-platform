CREATE OR REPLACE PROCEDURE conformed_refactored.dim_event_upsert()
LANGUAGE plpgsql
AS $$
BEGIN

    -- Step A: Audit Log Start
    DELETE FROM audit_refactored.audit_procedure_status
    WHERE procedure_name = 'dim_event_upsert';
    -- Step 0: Drop and Recreate Temporary Table
    DROP TABLE IF EXISTS temp_filtered_stage;

    CREATE TEMP TABLE temp_filtered_stage AS
    SELECT 
        stg.partition_event_name,
        stg.processed_dt,
        stg.processed_time
    FROM dap_txma_stage.txma_stage_layer stg
    JOIN conformed_refactored.batch_events_refactored bth
        ON stg.partition_event_name = bth.event_name
    WHERE TO_TIMESTAMP(
              LEFT(stg.processed_dt, 4) || '-' ||
              SUBSTRING(stg.processed_dt, 5, 2) || '-' ||
              RIGHT(stg.processed_dt, 2) || ' ' ||
              LPAD(LEFT(LPAD(stg.processed_time, 6, '0'), 2), 2, '0') || ':' ||
              LPAD(SUBSTRING(LPAD(stg.processed_time, 6, '0'), 3, 2), 2, '0') || ':' ||
              LPAD(RIGHT(LPAD(stg.processed_time, 6, '0'), 2), 2, '0'),
              'YYYY-MM-DD HH24:MI:SS'
          ) >= (
              SELECT COALESCE(MIN(max_run_date), '1999-01-01 00:00:00')
              FROM conformed_refactored.batch_events_refactored
          )
      AND bth.event_active = 1;


    INSERT INTO audit_refactored.audit_procedure_status (
        step_number,
        procedure_name,
        running_status,
        procedure_start_date
    )
    VALUES (
        1,
        'dim_event_upsert',
        'started',
        GETDATE()
    );

    -- Step 1: Update Existing Records
    UPDATE conformed_refactored.dim_event_refactored dim
    SET
        event_name = st.partition_event_name,
        modified_by = CURRENT_USER,
        modified_date = GETDATE()
    FROM (
        SELECT DISTINCT stg.partition_event_name
        FROM temp_filtered_stage stg
        WHERE stg.partition_event_name IN (
            SELECT event_name FROM conformed_refactored.dim_event_refactored
        )
    ) AS st
    WHERE dim.event_name = st.partition_event_name;

    -- Step 2: Insert New Records
    INSERT INTO conformed_refactored.dim_event_refactored (
        event_name,
        created_by,
        created_date,
        modified_by,
        modified_date
    )
    SELECT DISTINCT
        stg.partition_event_name,
        CURRENT_USER,
        GETDATE(),
        CURRENT_USER,
        GETDATE()
    FROM temp_filtered_stage stg
    WHERE stg.partition_event_name NOT IN (
        SELECT event_name FROM conformed_refactored.dim_event_refactored
    );

    -- Step B: Audit Log Complete
    UPDATE audit_refactored.audit_procedure_status
    SET
        running_status = 'Complete',
        procedure_end_date = GETDATE()
    WHERE procedure_name = 'dim_event_upsert';

    RAISE INFO 'dim_event_upsert: Procedure completed successfully.';

EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION '[dim_event_upsert] Error: %', SQLERRM;
END;
$$;