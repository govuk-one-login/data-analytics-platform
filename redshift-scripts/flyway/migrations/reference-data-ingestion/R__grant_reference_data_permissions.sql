grant all on database "dap_txma_reporting_db" to group dap_elt_processing;
grant all on schema "reference_data" to group dap_elt_processing;
grant all on all tables in schema "reference_data" to group dap_elt_processing;
grant usage on schema "reference_data" to group dap_elt_processing;