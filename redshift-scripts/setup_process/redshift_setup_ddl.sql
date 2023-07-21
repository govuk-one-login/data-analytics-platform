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
--      4. Date dimension table creation / population
--      5. Group
--      6. Database object privileges assigned to group
--      7. Create IAM user (step function IAM role)
--      8. User associated to group
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
4. Date dim table creation and population

- copy the contents of the file: redshift-scripts/setup_process/redshift_setup_ddl.sql
- paste into the redshift query editor
*/

-- click [Run] button to create the stored procedure: conformed.redshift_date_dim

-- run the following cmd once confirmed SP has been created
-- passing in the start, end dates for the date range to populate
-- the date dim table. 

CALL dap_txma_reporting_db.conformed.redshift_date_dim ('2022-01-01','2025-12-31')


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
GRANT ALL ON ALL TABLES IN SCHEMA "dap_txma_stage" TO GROUP dap_elt_processing;


/*
7. Create IAM user (used by the Redshift Step Function)
*/

CREATE USER "IAMR:{env}-dap-redshift-processing-role" PASSWORD DISABLE;

/*
8. User association to group
*/

ALTER GROUP dap_elt_processing ADD USER "<add username created in step (6)>";

