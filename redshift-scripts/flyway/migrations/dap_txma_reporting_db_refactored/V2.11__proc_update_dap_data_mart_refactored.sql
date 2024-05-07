CREATE OR REPLACE PROCEDURE conformed_refactored.update_dap_data_mart()
AS $$
BEGIN

call conformed_refactored.dim_event_upsert();
call conformed_refactored.dim_user_journey_event_upsert();
call conformed_refactored.dim_user_refactored_upsert();
call conformed_refactored.dim_journey_channel_refactored_upsert();
call conformed_refactored.dim_relying_party_refactored_upsert();
call conformed_refactored.fact_user_journey_event_refactored_upsert();
call conformed_refactored.event_extensions_refactored_upsert();
call conformed_refactored.update_event_batch_table();

END;
$$ LANGUAGE plpgsql;