-------------------------------------------------------------------------------
-- Author       Sarnjit Beesla
-- Created      2023-07-20
-- Purpose      redshift db objects setup scripts
--              incorporating data object security privileges
-- Run          This script should be run manually as "admin" user
-------------------------------------------------------------------------------
-- Modification History
--
-- 2023-07-20  Sarnjit Beesla  
--      Setup scripts to support the creation of the reporting datawarehouse
--      model.  Database objects cover the following:
--      1. Database
--      2. External schema
--      3. Conformed schema
--      4a. Date dimension table creation / population
--      4b. Conformed data objects creation / population
--      5. Group
--      6. Database object privileges assigned to group
--      7. Create IAM user (step function IAM role)
--      8. User associated to group
--      9. Alter table ownership to enable deletes/truncates
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
4a. Date dim table creation and population

- copy the contents of the file: redshift-scripts/setup_process/sp_conformed_date_dim.sql
- paste into the redshift query editor
*/

-- click [Run] button to create the stored procedure: conformed.redshift_date_dim

-- run the following cmd once confirmed SP has been created
-- passing in the start, end dates for the date range to populate
-- the date dim table. 

CALL dap_txma_reporting_db.conformed.redshift_date_dim ('2022-01-01','2025-12-31')


/*
4b. Batch control table creation and population
*/

-- copy the contents of the file: redshift-scripts/setup_process/sp_conformed_data_objects.sql
-- paste into the redshift query editor

-- click [Run] button to create the stored procedure: conformed.sp_conformed_data_objects

-- run the following cmd once confirmed SP has been created
-- passing in the start, end dates for the date range to populate
-- the date dim table. 

CALL dap_txma_reporting_db.conformed.sp_conformed_data_objects()


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
--GRANT ALL ON ALL TABLES IN SCHEMA "dap_txma_stage" TO GROUP dap_elt_processing;
--GRANT SELECT ON ALL TABLES IN SCHEMA "dap_txma_stage" TO GROUP dap_elt_processing;



/*
7. Create IAM user (used by the Redshift Step Function)
*/

CREATE USER "IAMR:{env}-dap-redshift-processing-role" PASSWORD DISABLE;

/*
8. User association to group
*/

ALTER GROUP dap_elt_processing ADD USER "<add username created in step (6)>";


/*
9. Alter table ownership
*/

ALTER TABLE dap_txma_reporting_db.conformed.ref_events OWNER TO "IAMR:dev-dap-redshift-processing-role";