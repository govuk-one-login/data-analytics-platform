alter table conformed_refactored.fact_user_journey_event_refactored
add column event_timestamp_ms bigint;

alter table conformed_refactored.fact_user_journey_event_refactored
add column event_timestamp_ms_formatted varchar;

update conformed_refactored.fact_user_journey_event_refactored
set
event_timestamp_ms=st.event_timestamp_ms,
event_timestamp_ms_formatted=st.event_timestamp_ms_formatted,
MODIFIED_BY=current_user,
MODIFIED_DATE=CURRENT_DATE 
from
(select event_id,event_timestamp_ms,event_timestamp_ms_formatted
from
(select ROW_NUMBER() OVER (PARTITION BY event_id ORDER BY event_timestamp_ms_formatted) rn,
event_id,event_timestamp_ms,event_timestamp_ms_formatted
from  "dap_txma_reporting_db_refactored"."dap_txma_stage"."txma_stage_layer"
--where event_id in ('0c681b99-ebbc-41b7-bd26-080cc9fcbdc8','62c445a6-23a0-47e5-a5c9-8d5d2f98f2ad')
)
where rn=1) st
WHERE fact_user_journey_event_refactored.event_id = st.event_id;