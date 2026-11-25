/*
Database access for developers running dbt locally against the production-preview environment.

This is a MANUAL, ONE OFF script (like redshift_setup_process_scripts_refactored.sql) - it is deliberately not a flyway
migration. Flyway migrations are run against every environment, and a grant to a group or user that does not exist in an
environment makes the migration fail, which then blocks every later migration in that environment.

Run as the admin user, connected to dap_txma_reporting_db_refactored, in the production-preview account only.
The IAM role referenced below is DbtDeveloperRole in iac/main/resources/dbt-access.yml.

--**REPLACE {env}** (production-preview)
*/

CREATE GROUP dap_dbt_developers;

-- Redshift Serverless maps the IAM role to the database user IAMR:<role name> when the role gets credentials
CREATE USER "IAMR:{env}-dap-dbt-developer-role" PASSWORD DISABLE CONNECTION LIMIT 10;
ALTER GROUP dap_dbt_developers ADD USER "IAMR:{env}-dap-dbt-developer-role";

-- stop runaway queries (30 minutes) so a bad model can't hold up the pipeline's stored procedures
ALTER USER "IAMR:{env}-dap-dbt-developer-role" SET statement_timeout TO 1800000;

/*
dbt creates its own schemas (e.g. dbt_<developer name>) so it needs to be able to create schemas in the database.
Note that all developers share the one database user, so they all own each other's dbt schemas.
*/
GRANT CREATE ON DATABASE "dap_txma_reporting_db_refactored" TO GROUP dap_dbt_developers;

/*
Read only access to the schemas that dbt reads from. dbt has no access to write to these schemas as they are populated
by the stored procedures and managed by flyway.
*/
GRANT USAGE ON SCHEMA "conformed_refactored" TO GROUP dap_dbt_developers;
GRANT SELECT ON ALL TABLES IN SCHEMA "conformed_refactored" TO GROUP dap_dbt_developers;
GRANT USAGE ON SCHEMA "presentation_refactored" TO GROUP dap_dbt_developers;
GRANT SELECT ON ALL TABLES IN SCHEMA "presentation_refactored" TO GROUP dap_dbt_developers;
GRANT USAGE ON SCHEMA "reference_data" TO GROUP dap_dbt_developers;
GRANT SELECT ON ALL TABLES IN SCHEMA "reference_data" TO GROUP dap_dbt_developers;

/*
Tables and views that flyway creates later are owned by the admin user, so grant access to those automatically
*/
ALTER DEFAULT PRIVILEGES FOR USER admin IN SCHEMA "conformed_refactored" GRANT SELECT ON TABLES TO GROUP dap_dbt_developers;
ALTER DEFAULT PRIVILEGES FOR USER admin IN SCHEMA "presentation_refactored" GRANT SELECT ON TABLES TO GROUP dap_dbt_developers;
ALTER DEFAULT PRIVILEGES FOR USER admin IN SCHEMA "reference_data" GRANT SELECT ON TABLES TO GROUP dap_dbt_developers;

/*
To undo all of the above:

REVOKE ALL ON ALL TABLES IN SCHEMA "conformed_refactored" FROM GROUP dap_dbt_developers;
REVOKE ALL ON ALL TABLES IN SCHEMA "presentation_refactored" FROM GROUP dap_dbt_developers;
REVOKE ALL ON ALL TABLES IN SCHEMA "reference_data" FROM GROUP dap_dbt_developers;
REVOKE USAGE ON SCHEMA "conformed_refactored" FROM GROUP dap_dbt_developers;
REVOKE USAGE ON SCHEMA "presentation_refactored" FROM GROUP dap_dbt_developers;
REVOKE USAGE ON SCHEMA "reference_data" FROM GROUP dap_dbt_developers;
REVOKE CREATE ON DATABASE "dap_txma_reporting_db_refactored" FROM GROUP dap_dbt_developers;
ALTER DEFAULT PRIVILEGES FOR USER admin IN SCHEMA "conformed_refactored" REVOKE SELECT ON TABLES FROM GROUP dap_dbt_developers;
ALTER DEFAULT PRIVILEGES FOR USER admin IN SCHEMA "presentation_refactored" REVOKE SELECT ON TABLES FROM GROUP dap_dbt_developers;
ALTER DEFAULT PRIVILEGES FOR USER admin IN SCHEMA "reference_data" REVOKE SELECT ON TABLES FROM GROUP dap_dbt_developers;
-- drop any dbt_* schemas first (DROP SCHEMA ... CASCADE), then:
DROP USER "IAMR:{env}-dap-dbt-developer-role";
DROP GROUP dap_dbt_developers;
*/
