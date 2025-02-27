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
