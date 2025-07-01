CREATE OR REPLACE PROCEDURE conformed_refactored.dim_user_journey_event_upsert()
LANGUAGE plpgsql
AS $$
BEGIN

    -- Step A: Audit - start
    DELETE FROM audit_refactored.audit_procedure_status
    WHERE procedure_name = 'dim_user_journey_event_upsert';

    -- Step 0: Create a filtered temporary stage table
    DROP TABLE IF EXISTS temp_filtered_stage;

    CREATE TEMP TABLE temp_filtered_stage AS
    SELECT 
        stg.user_govuk_signin_journey_id,
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
        2,
        'dim_user_journey_event_upsert',
        'started',
        GETDATE()
    );

    -- Step 1: Update existing records
    UPDATE conformed_refactored.dim_user_journey_event_refactored dim
    SET
        user_govuk_signin_journey_id = st.user_govuk_signin_journey_id,
        modified_by = CURRENT_USER,
        modified_date = GETDATE()
    FROM (
        SELECT DISTINCT stg.user_govuk_signin_journey_id
        FROM temp_filtered_stage stg
        WHERE stg.user_govuk_signin_journey_id IN (
            SELECT user_govuk_signin_journey_id
            FROM conformed_refactored.dim_user_journey_event_refactored
        )
    ) AS st
    WHERE dim.user_govuk_signin_journey_id = st.user_govuk_signin_journey_id;

    -- Step 2: Insert new records
    INSERT INTO conformed_refactored.dim_user_journey_event_refactored (
        user_govuk_signin_journey_id,
        created_by,
        created_date,
        modified_by,
        modified_date
    )
    SELECT DISTINCT
        stg.user_govuk_signin_journey_id,
        CURRENT_USER,
        GETDATE(),
        CURRENT_USER,
        GETDATE()
    FROM temp_filtered_stage stg
    LEFT JOIN conformed_refactored.dim_user_journey_event_refactored dim
        ON stg.user_govuk_signin_journey_id = dim.user_govuk_signin_journey_id
    WHERE stg.user_govuk_signin_journey_id IS NOT NULL
      AND dim.user_govuk_signin_journey_id IS NULL;

    -- Step B: Audit - complete
    UPDATE audit_refactored.audit_procedure_status
    SET
        running_status = 'Complete',
        procedure_end_date = GETDATE()
    WHERE procedure_name = 'dim_user_journey_event_upsert';

    RAISE INFO 'dim_user_journey_event_upsert: Procedure completed successfully.';

EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION '[dim_user_journey_event_upsert] Error: %', SQLERRM;
END;
$$;
