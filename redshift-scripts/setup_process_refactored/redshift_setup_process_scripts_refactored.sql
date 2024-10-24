
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
 IMPORTANT: Run flyway scripts to add all stored procedures in to redshift, see redshift-scripts/flyway/README.md for details
*/


/*
Database object privileges to group
*/

GRANT ALL ON DATABASE "dap_txma_reporting_db" TO GROUP dap_elt_processing;
GRANT ALL ON SCHEMA "audit" TO GROUP dap_elt_processing;
GRANT ALL ON ALL TABLES IN SCHEMA "audit" TO GROUP dap_elt_processing;
GRANT USAGE ON SCHEMA "dap_txma_stage" TO GROUP dap_elt_processing;


/*
Database object privileges to group
*/

GRANT ALL ON DATABASE "dap_txma_reporting_db_refactored" TO GROUP dap_elt_processing;
GRANT ALL ON SCHEMA "audit_refactored" TO GROUP dap_elt_processing;
GRANT ALL ON ALL TABLES IN SCHEMA "audit_refactored" TO GROUP dap_elt_processing;
