CREATE DATABASE dap_txma_reporting_db_refactored;

configure external schema dap_txma_stage(make sure the name is correct)

--Then Logon to the database and create the schemas.
CREATE SCHEMA audit_refactored;
CREATE SCHEMA conformed_refactored;
CREATE SCHEMA presentation_refactored;