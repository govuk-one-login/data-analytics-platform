CREATE OR REPLACE PROCEDURE conformed_refactored.dim_relying_party_refactored_upsert()
 LANGUAGE plpgsql
AS $$
DECLARE
BEGIN

        delete from  audit_refactored.audit_procedure_status
        where Procedure_name='dim_relying_party_refactored_upsert';
        
        insert into audit_refactored.audit_procedure_status
        (step_number,Procedure_name,running_status,procedure_start_date)
        values(5,'dim_relying_party_refactored_upsert','started',sysdate);

INSERT INTO  conformed_refactored.dim_relying_party_refactored (CLIENT_ID, RELYING_PARTY_NAME, DISPLAY_NAME, department_name 
                                                               ,agency_name,CREATED_BY, CREATED_DATE, MODIFIED_BY, MODIFIED_DATE)
SELECT 
 CLIENT_ID
,CLIENT_NAME
,DISPLAY_NAME
,department_name
,agency_name
,current_user
,CURRENT_DATE
,current_user
,CURRENT_DATE 
from 
(SELECT
    NVL(st.CLIENT_ID, '-1') AS CLIENT_ID,
    st.CLIENT_NAME,
    st.DISPLAY_NAME,
    st.partition_event_name,
    st.department_name,
    st.agency_name
FROM (
    SELECT * FROM (
        SELECT
            ROW_NUMBER() OVER(PARTITION BY CLIENT_ID ORDER BY processed_dt DESC) AS ROW_NUMBER_Client_id,
            *
        FROM (
            SELECT DISTINCT
                mn.CLIENT_ID,
                mn.processed_dt,
                mn.processed_time,
                ref.CLIENT_NAME,
                ref.DISPLAY_NAME,
                ref.department_name,
                ref.agency_name,
                mn.partition_event_name,
                current_user,
                CURRENT_DATE,
                current_user,
                CURRENT_DATE
            FROM dap_txma_stage.txma_stage_layer mn
            LEFT JOIN conformed_refactored.ref_relying_parties_refactored ref ON NVL(mn.CLIENT_ID, '-1') = NVL(ref.CLIENT_ID, '-1')
            JOIN conformed_refactored.batch_events_refactored bth ON mn.partition_event_name = bth.event_name
        )
    ) WHERE ROW_NUMBER_Client_id = 1
) st
WHERE NVL(st.CLIENT_ID, '-1') NOT IN (
    SELECT NVL(CLIENT_ID, '-1') 
    FROM conformed_refactored.dim_relying_party_refactored
)
AND TO_TIMESTAMP(
                        LEFT(processed_dt, 4) || '-' || 
                        SUBSTRING(processed_dt, 5, 2) || '-' || 
                        RIGHT(processed_dt, 2) || ' ' || 
                        LPAD(LEFT(LPAD(processed_time, 6, '0'), 2), 2, '0') || ':' || 
                        LPAD(SUBSTRING(LPAD(processed_time, 6, '0'), 3, 2), 2, '0') || ':' || 
                        LPAD(RIGHT(LPAD(processed_time, 6, '0'), 2), 2, '0'),
                        'YYYY-MM-DD HH24:MI:SS'  -- Format string
                    )  >= (
    SELECT NVL(MIN((max_run_date)), '1999-01-01 00:00:00')
    FROM conformed_refactored.batch_events_refactored
)) main 
JOIN conformed_refactored.batch_events_refactored bth ON main.partition_event_name = bth.event_name
AND bth.event_active =1;


UPDATE conformed_refactored.dim_relying_party_refactored
    SET client_id=st.CLIENT_ID,
    relying_party_name=st.client_name,
    display_name=st.display_name,
    department_name=st.department_name,
    agency_name=st.agency_name
    FROM 
    (SELECT 
    NVL(CLIENT_ID, '-1') AS CLIENT_ID,
    client_name,
    display_name,
    department_name,
    agency_name
    FROM (
        SELECT
            ROW_NUMBER() OVER(PARTITION BY CLIENT_ID ORDER BY processed_dt DESC) AS ROW_NUMBER_Client_id,
            *
        FROM (
            SELECT DISTINCT
                mn.CLIENT_ID,
                mn.processed_dt,
                ref.CLIENT_NAME,
                ref.DISPLAY_NAME,
                ref.department_name,
                ref.agency_name,
                mn.partition_event_name,
                current_user,
                CURRENT_DATE,
                current_user,
                CURRENT_DATE
            FROM dap_txma_stage.txma_stage_layer mn
            LEFT JOIN conformed_refactored.ref_relying_parties_refactored ref ON NVL(mn.CLIENT_ID, '-1') = NVL(ref.CLIENT_ID, '-1')
            JOIN conformed_refactored.batch_events_refactored bth ON mn.partition_event_name = bth.event_name
            and bth.event_active =1 
            and TO_TIMESTAMP(
                        LEFT(processed_dt, 4) || '-' || 
                        SUBSTRING(processed_dt, 5, 2) || '-' || 
                        RIGHT(processed_dt, 2) || ' ' || 
                        LPAD(LEFT(LPAD(processed_time, 6, '0'), 2), 2, '0') || ':' || 
                        LPAD(SUBSTRING(LPAD(processed_time, 6, '0'), 3, 2), 2, '0') || ':' || 
                        LPAD(RIGHT(LPAD(processed_time, 6, '0'), 2), 2, '0'),
                        'YYYY-MM-DD HH24:MI:SS'  -- Format string
                    )  >=  (SELECT NVL(MIN((max_run_date )),'1999-01-01 00:00:00')
                                                        FROM conformed_refactored.batch_events_refactored)
        )
    ) WHERE ROW_NUMBER_Client_id = 1)AS st
            WHERE dim_relying_party_refactored.Client_id = st.Client_id
            and (NVL(dim_relying_party_refactored.relying_party_name,'X')<>st.client_name
            or NVL(dim_relying_party_refactored.display_name,'X')<>st.display_name
            or  NVL(dim_relying_party_refactored.department_name,'X')<>st.department_name
            or  NVL(dim_relying_party_refactored.agency_name,'X')<>st.agency_name);

        update audit_refactored.audit_procedure_status
        set running_status='Complete'
        ,procedure_end_date=sysdate
        where Procedure_name='dim_relying_party_refactored_upsert';     

    raise info 'dim Relying Party refactored update in conformed layer ran successfully';

EXCEPTION WHEN OTHERS THEN 
    RAISE EXCEPTION'[Error while dim Relying Party refactored update in conformed layer ] Exception: %',sqlerrm;

END;
$$
