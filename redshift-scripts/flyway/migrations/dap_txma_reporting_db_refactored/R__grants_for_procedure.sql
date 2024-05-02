GRANT EXECUTE ON procedure conformed_refactored.update_dap_data_mart() TO "IAMR:dev-dap-redshift-processing-role";
GRANT EXECUTE ON procedure conformed_refactored.dim_event_upsert() TO "IAMR:dev-dap-redshift-processing-role";
GRANT EXECUTE ON procedure conformed_refactored.dim_journey_channel_refactored_upsert() TO "IAMR:dev-dap-redshift-processing-role";
GRANT EXECUTE ON procedure conformed_refactored.dim_relying_party_refactored_upsert() TO "IAMR:dev-dap-redshift-processing-role";
GRANT EXECUTE ON procedure conformed_refactored.dim_user_journey_event_upsert() TO "IAMR:dev-dap-redshift-processing-role";
GRANT EXECUTE ON procedure conformed_refactored.dim_user_refactored_upsert() TO "IAMR:dev-dap-redshift-processing-role";
GRANT EXECUTE ON procedure conformed_refactored.event_extensions_refactored_upsert() TO "IAMR:dev-dap-redshift-processing-role";
GRANT EXECUTE ON procedure conformed_refactored.fact_user_journey_event_refactored_upsert() TO "IAMR:dev-dap-redshift-processing-role";
GRANT EXECUTE ON procedure conformed_refactored.redshift_date_dim() TO "IAMR:dev-dap-redshift-processing-role";
GRANT EXECUTE ON procedure conformed_refactored.update_event_batch_table() TO "IAMR:dev-dap-redshift-processing-role";

GRANT ALL ON DATABASE "dap_txma_reporting_db_refactored" TO GROUP dap_elt_processing;
GRANT ALL ON SCHEMA "conformed_refactored" TO GROUP dap_elt_processing;
GRANT ALL ON ALL TABLES IN SCHEMA "conformed_refactored" TO GROUP dap_elt_processing;
GRANT USAGE ON SCHEMA "dap_txma_stage" TO GROUP dap_elt_processing;


/*
Database object privileges to group
*/

GRANT ALL ON DATABASE "dap_txma_reporting_db_refactored" TO GROUP dap_elt_processing;
GRANT ALL ON SCHEMA "audit_refactored" TO GROUP dap_elt_processing;
GRANT ALL ON ALL TABLES IN SCHEMA "audit_refactored" TO GROUP dap_elt_processing;