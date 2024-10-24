
CREATE DATABASE dap_txma_reporting_db_refactored;


-- Log in to database before running below scripts


/*
External Schema

create external schema with name 'dap_txma_stage'
replacing the following values, based upon which
environment the script is being run against

i. DATABASE
ii. IAM_ROLE
*/

--**ENSURE DATBASE CREATED IN STEP(1) IS SELECTED**
--**REPLACE {env}**
--**REPLACE {aws-account-id}**
CREATE EXTERNAL SCHEMA IF NOT EXISTS dap_txma_stage
FROM DATA CATALOG
DATABASE '{env}-txma-stage'
REGION 'eu-west-2'
IAM_ROLE 'arn:aws:iam::{aws-account-id}:role/{env}-redshift-serverless-role';


/*
Create Schema
*/

--**ENSURE DATBASE CREATED IN STEP(1) IS SELECTED**

CREATE SCHEMA audit_refactored;
CREATE SCHEMA conformed_refactored;
CREATE SCHEMA presentation_refactored;


/*
Group
*/

CREATE GROUP dap_elt_processing;


/*
Create IAM user (used by the Redshift Step Function)
--**REPLACE {env}**
*/

--**REPLACE {env}**
CREATE USER "IAMR:{env}-dap-redshift-processing-role" PASSWORD DISABLE;


/*
 IMPORTANT: Run flyway scripts to update all stored procedures
*/


/*
Database object privileges to group
*/

GRANT ALL ON DATABASE "dap_txma_reporting_db" TO GROUP dap_elt_processing;
GRANT ALL ON SCHEMA "audit" TO GROUP dap_elt_processing;
GRANT ALL ON ALL TABLES IN SCHEMA "audit" TO GROUP dap_elt_processing;


/*
User association to group
*/

--**REPLACE {env}**
ALTER GROUP dap_elt_processing ADD USER "IAMR:dev-dap-redshift-processing-role";


/*
Alter table ownership
*/

--**REPLACE {env}**
ALTER TABLE dap_txma_reporting_db.conformed.ref_events OWNER TO "IAMR:dev-dap-redshift-processing-role";
ALTER TABLE dap_txma_reporting_db.conformed.ref_relying_parties OWNER TO "IAMR:dev-dap-redshift-processing-role";


/*
Alter table ownership
*/

--**REPLACE {env}**

ALTER TABLE dap_txma_reporting_db.audit.err_duplicate_event_id_auth_account_creation_1 OWNER TO "IAMR:dev-dap-redshift-processing-role";	
ALTER TABLE dap_txma_reporting_db.audit.err_duplicate_event_id_auth_orchestration_2	OWNER TO "IAMR:dev-dap-redshift-processing-role";
ALTER TABLE dap_txma_reporting_db.audit.err_duplicate_event_id_auth_account_user_login_3 OWNER TO "IAMR:dev-dap-redshift-processing-role";	
ALTER TABLE dap_txma_reporting_db.audit.err_duplicate_event_id_dcmaw_cri_4 OWNER TO "IAMR:dev-dap-redshift-processing-role";
ALTER TABLE dap_txma_reporting_db.audit.err_duplicate_event_id_auth_account_mfa_5 OWNER TO "IAMR:dev-dap-redshift-processing-role";
ALTER TABLE dap_txma_reporting_db.audit.err_duplicate_event_id_auth_account_management_6 OWNER TO "IAMR:dev-dap-redshift-processing-role";	
ALTER TABLE dap_txma_reporting_db.audit.err_duplicate_event_id_ipv_cri_address_7 OWNER TO "IAMR:dev-dap-redshift-processing-role";
ALTER TABLE dap_txma_reporting_db.audit.err_duplicate_event_id_ipv_cri_driving_license_8 OWNER TO "IAMR:dev-dap-redshift-processing-role";	
ALTER TABLE dap_txma_reporting_db.audit.err_duplicate_event_id_ipv_cri_fraud_9 OWNER TO "IAMR:dev-dap-redshift-processing-role";
ALTER TABLE dap_txma_reporting_db.audit.err_duplicate_event_id_ipv_journey_10 OWNER TO "IAMR:dev-dap-redshift-processing-role";
ALTER TABLE dap_txma_reporting_db.audit.err_duplicate_event_id_ipv_cri_kbv_11 OWNER TO "IAMR:dev-dap-redshift-processing-role";
ALTER TABLE dap_txma_reporting_db.audit.err_duplicate_event_id_ipv_cri_passport_12 OWNER TO "IAMR:dev-dap-redshift-processing-role";
ALTER TABLE dap_txma_reporting_db.audit.err_duplicate_event_id_ipv_cri_cic_13 OWNER TO "IAMR:dev-dap-redshift-processing-role";
ALTER TABLE dap_txma_reporting_db.audit.err_duplicate_event_id_ipv_cri_f2f_14 OWNER TO "IAMR:dev-dap-redshift-processing-role";

-- run the following cmds once confirmed SPs has been created

CALL dap_txma_reporting_db.conformed.sp_auth_orchestration_beyond_mvp ()
CALL dap_txma_reporting_db.conformed.sp_auth_account_user_login_beyond_mvp ()
CALL dap_txma_reporting_db.conformed.sp_ipv_cri_address_beyond_mvp ()
CALL dap_txma_reporting_db.conformed.sp_ipv_fraud_beyond_mvp ()


-- drop temp beyon mvp procedures

copy the contents of the files:

-- redshift-scripts/setup_process/drop_temp_procedure_after_release.sql

click [Run] button to run the DROP statements
