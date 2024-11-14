CREATE OR REPLACE PROCEDURE conformed_refactored.event_extensions_refactored_upsert()
 LANGUAGE plpgsql
AS $$
DECLARE
BEGIN

        delete from  audit_refactored.audit_procedure_status
        where Procedure_name='event_extensions_refactored_upsert';
        
        insert into audit_refactored.audit_procedure_status
        (step_number,Procedure_name,running_status,procedure_start_date)
        values(7,'event_extensions_refactored_upsert','started',sysdate);

INSERT INTO  conformed_refactored.event_extensions_refactored ( user_journey_event_key,Parent_attribute_name,event_attribute_name,event_attribute_value,event_id,
                                                CREATED_BY, CREATED_DATE, MODIFIED_BY, MODIFIED_DATE)
 SELECT distinct
        fct.user_journey_event_key,parent_column_name Parent_attribute_name,
        key event_attribute_name ,value event_attribute_value,stage_key_val.event_id,
        current_user,        CURRENT_DATE,        current_user,        CURRENT_DATE 
        FROM  conformed_refactored.fact_user_journey_event_refactored fct
         join  (SELECT event_id,parent_column_name,key,value,processed_dt from
              (SELECT *,row_number()over(partition by event_id,parent_column_name,key,value order by processed_dt) row_nm
               FROM dap_txma_stage.txma_stage_layer_key_values)
               where row_nm=1) stage_key_val
        on fct.event_id=stage_key_val.event_id
        join conformed_refactored.DIM_EVENT_refactored DE ON fct.event_key = DE.EVENT_key
        JOIN conformed_refactored.batch_events_refactored bth ON  de.event_name=bth.event_name
        AND TO_TIMESTAMP(
                        LEFT(processed_dt, 4) || '-' || 
                        SUBSTRING(processed_dt, 5, 2) || '-' || 
                        RIGHT(processed_dt, 2) || ' ' || 
                        LPAD(LEFT(LPAD(processed_time, 6, '0'), 2), 2, '0') || ':' || 
                        LPAD(SUBSTRING(LPAD(processed_time, 6, '0'), 3, 2), 2, '0') || ':' || 
                        LPAD(RIGHT(LPAD(processed_time, 6, '0'), 2), 2, '0'),
                        'YYYY-MM-DD HH24:MI:SS'  -- Format string
                    )   >= (SELECT NVL(MIN((max_run_date )),'1999-01-01 00:00:00')
                                                     FROM  conformed_refactored.batch_events_refactored) 
        AND bth.event_active =1                                                     
        left join conformed_refactored.event_extensions_refactored ext
        on ext.user_journey_event_key= fct.user_journey_event_key
        and ext.event_attribute_name=stage_key_val.key  
        where ext.event_attribute_name IS NULL ;


UPDATE  conformed_refactored.event_extensions_refactored
    SET
       user_journey_event_key=st.user_journey_event_key 
      ,Parent_attribute_name=st.Parent_attribute_name
      ,event_attribute_name =st.event_attribute_name
      ,event_attribute_value =st.event_attribute_value
      ,event_id=st.event_id
      ,MODIFIED_BY=current_user
      ,MODIFIED_DATE=CURRENT_DATE
    FROM ( SELECT distinct 
       fct.user_journey_event_key,parent_column_name Parent_attribute_name,key event_attribute_name ,value event_attribute_value,stage_key_val.event_id
        FROM  conformed_refactored.fact_user_journey_event_refactored fct
         join  (SELECT event_id,parent_column_name,key,value,processed_dt from
              (SELECT *,row_number()over(partition by event_id,parent_column_name,key,value order by processed_dt) row_nm
               FROM dap_txma_stage.txma_stage_layer_key_values)
               where row_nm=1  ) stage_key_val
        on fct.event_id=stage_key_val.event_id
        join conformed_refactored.DIM_EVENT_refactored DE ON fct.event_key = DE.EVENT_key
        JOIN conformed_refactored.batch_events_refactored bth ON  de.event_name=bth.event_name
        AND TO_TIMESTAMP(
                        LEFT(processed_dt, 4) || '-' || 
                        SUBSTRING(processed_dt, 5, 2) || '-' || 
                        RIGHT(processed_dt, 2) || ' ' || 
                        LPAD(LEFT(LPAD(processed_time, 6, '0'), 2), 2, '0') || ':' || 
                        LPAD(SUBSTRING(LPAD(processed_time, 6, '0'), 3, 2), 2, '0') || ':' || 
                        LPAD(RIGHT(LPAD(processed_time, 6, '0'), 2), 2, '0'),
                        'YYYY-MM-DD HH24:MI:SS'  -- Format string
                    )   >= (SELECT NVL(MIN((max_run_date )),'1999-01-01 00:00:00')
                                                     FROM  conformed_refactored.batch_events_refactored)
        AND bth.event_active =1                                                     
        join conformed_refactored.event_extensions_refactored ext
        on ext.user_journey_event_key= fct.user_journey_event_key 
        and ext.event_attribute_name=stage_key_val.key  )AS st
    WHERE event_extensions_refactored.user_journey_event_key = st.user_journey_event_key     
    and event_extensions_refactored.event_attribute_name=st.event_attribute_name ;    


  DELETE FROM "conformed_refactored"."event_extensions_refactored"
  WHERE user_journey_event_key IN (select distinct main_user_journey_event_key from 
    (SELECT DISTINCT main.user_journey_event_key main_user_journey_event_key,fct.user_journey_event_key fct_user_journey_event_key
    FROM  "conformed_refactored"."event_extensions_refactored" main
    LEFT JOIN  "conformed_refactored"."fact_user_journey_event_refactored" fct 
    ON main.user_journey_event_key = fct.user_journey_event_key
    ) 
    WHERE  fct_user_journey_event_key is null
);

        update audit_refactored.audit_procedure_status
        set running_status='Complete'
        ,procedure_end_date=sysdate
        where Procedure_name='event_extensions_refactored_upsert';  

END;
$$
