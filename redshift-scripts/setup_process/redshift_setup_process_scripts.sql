-------------------------------------------------------------------------------
-- Author       Sarnjit Beesla
-- Created      2023-07-20
-- Purpose      redshift db objects setup scripts
--              incorporating data object security privileges
-- Run          This script should be run manually as "admin" user
-------------------------------------------------------------------------------
-- Modification History:
--
-- 2023-07-20  Sarnjit Beesla  
--      Setup scripts to support the creation of the reporting datawarehouse
--      model.  Database objects cover the following:
--      1. Database
--      2. External schema
--      3. Conformed schema
--      4a. Conformed data objects creation / population
--      4b. Date dimension table population
--      4c. Conformed stage view data objects creation
--      5. Group
--      6. Database object privileges assigned to group
--      7. Create IAM user (step function IAM role)
--      8. User associated to group
--      9. Alter table ownership to enable deletes/truncates
--
-- 2023-08-23  Sarnjit Beesla  
--      Setup scripts to support the management of Stage layer duplicates
--      Database objects cover the following:
--      10. Audit schema
--      11. Audit data objects creation
--      12. Database object privileges assigned to group
--      13. Alter table ownership to enable inserts
-------------------------------------------------------------------------------


/*
1. Database
*/

CREATE DATABASE dap_txma_reporting_db;

/*
2. External Schema

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
3. Conformed Schema
*/

--**ENSURE DATBASE CREATED IN STEP(1) IS SELECTED**

CREATE SCHEMA IF NOT EXISTS conformed;


/*
4a. Dimension, fact, control and ref tables creation and population
*/

-- copy the contents of the file: redshift-scripts/setup_process/sp_conformed_data_objects.sql
-- paste into the redshift query editor

-- click [Run] button to create the stored procedure: conformed.sp_conformed_data_objects

-- run the following cmd once confirmed SP has been created

CALL dap_txma_reporting_db.conformed.sp_conformed_data_objects()

/*
4a. Date dim table population

- copy the contents of the file: redshift-scripts/setup_process/sp_conformed_date_dim.sql
- paste into the redshift query editor
*/

-- click [Run] button to create the stored procedure: conformed.redshift_date_dim

-- run the following cmd once confirmed SP has been created
-- passing in the start, end dates for the date range to populate
-- the date dim table. 

CALL dap_txma_reporting_db.conformed.redshift_date_dim ('2022-01-01','2025-12-31')


/*
4c Conformed Stage view object creation
*/

-- copy the contents of the file: redshift-scripts/setup_process/sp_conformed_stage_view_data_objects.sql
-- paste into the redshift query editor

-- click [Run] button to create the stored procedure: conformed.sp_conformed_stage_view_data_objects

-- run the following cmd once confirmed SP has been created

CALL dap_txma_reporting_db.conformed.sp_conformed_stage_view_data_objects()


/*
5. Group
*/

CREATE GROUP dap_elt_processing;


/*
6. Database object privileges to group
*/

GRANT ALL ON DATABASE "dap_txma_reporting_db" TO GROUP dap_elt_processing;
GRANT ALL ON SCHEMA "conformed" TO GROUP dap_elt_processing;
GRANT ALL ON ALL TABLES IN SCHEMA "conformed" TO GROUP dap_elt_processing;
GRANT USAGE ON SCHEMA "dap_txma_stage" TO GROUP dap_elt_processing;


/*
7. Create IAM user (used by the Redshift Step Function)
*/

--**REPLACE {env}**
CREATE USER "IAMR:{env}-dap-redshift-processing-role" PASSWORD DISABLE;

/*
8. User association to group
*/

--**REPLACE {env}**
ALTER GROUP dap_elt_processing ADD USER "IAMR:{env}-dap-redshift-processing-role";


/*
9. Alter table ownership
*/

--**REPLACE {env}**
ALTER TABLE dap_txma_reporting_db.conformed.ref_events OWNER TO "IAMR:{env}-dap-redshift-processing-role";
ALTER TABLE dap_txma_reporting_db.conformed.ref_relying_parties OWNER TO "IAMR:{env}-dap-redshift-processing-role";


/*
10. Audi Schema
*/

--**ENSURE DATBASE CREATED IN STEP(1) IS SELECTED**

CREATE SCHEMA IF NOT EXISTS audit;


/*
11. Product Family Audit table creation and population
*/

-- copy the contents of the file: redshift-scripts/setup_process/sp_audit_data_objects.sql
-- paste into the redshift query editor

-- click [Run] button to create the stored procedure: audit.sp_conformed_data_objects

-- run the following cmd once confirmed SP has been created

CALL dap_txma_reporting_db.audit.sp_audit_data_objects()


/*
12. Database object privileges to group
*/

GRANT ALL ON DATABASE "dap_txma_reporting_db" TO GROUP dap_elt_processing;
GRANT ALL ON SCHEMA "audit" TO GROUP dap_elt_processing;
GRANT ALL ON ALL TABLES IN SCHEMA "audit" TO GROUP dap_elt_processing;


/*
13. Alter table ownership
*/

--**REPLACE {env}**

ALTER TABLE dap_txma_reporting_db.audit.err_duplicate_event_id_auth_account_creation_1 OWNER TO "IAMR:{env}-dap-redshift-processing-role";	
ALTER TABLE dap_txma_reporting_db.audit.err_duplicate_event_id_auth_orchestration_2	OWNER TO "IAMR:{env}-dap-redshift-processing-role";
ALTER TABLE dap_txma_reporting_db.audit.err_duplicate_event_id_auth_account_user_login_3 OWNER TO "IAMR:{env}-dap-redshift-processing-role";	
ALTER TABLE dap_txma_reporting_db.audit.err_duplicate_event_id_dcmaw_cri_4 OWNER TO "IAMR:{env}-dap-redshift-processing-role";
ALTER TABLE dap_txma_reporting_db.audit.err_duplicate_event_id_auth_account_mfa_5 OWNER TO "IAMR:{env}-dap-redshift-processing-role";
ALTER TABLE dap_txma_reporting_db.audit.err_duplicate_event_id_auth_account_management_6 OWNER TO "IAMR:{env}-dap-redshift-processing-role";	
ALTER TABLE dap_txma_reporting_db.audit.err_duplicate_event_id_ipv_cri_address_7 OWNER TO "IAMR:{env}-dap-redshift-processing-role";
ALTER TABLE dap_txma_reporting_db.audit.err_duplicate_event_id_ipv_cri_driving_license_8 OWNER TO "IAMR:{env}-dap-redshift-processing-role";	
ALTER TABLE dap_txma_reporting_db.audit.err_duplicate_event_id_ipv_cri_fraud_9 OWNER TO "IAMR:{env}-dap-redshift-processing-role";
ALTER TABLE dap_txma_reporting_db.audit.err_duplicate_event_id_ipv_journey_10 OWNER TO "IAMR:{env}-dap-redshift-processing-role";
ALTER TABLE dap_txma_reporting_db.audit.err_duplicate_event_id_ipv_cri_kbv_11 OWNER TO "IAMR:{env}-dap-redshift-processing-role";
ALTER TABLE dap_txma_reporting_db.audit.err_duplicate_event_id_ipv_cri_passport_12 OWNER TO "IAMR:{env}-dap-redshift-processing-role";
