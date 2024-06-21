CREATE VIEW conformed_refactored.vw_dim_user_refactored
AS
SELECT
    *
FROM
    "dap_txma_reporting_db_refactored"."conformed_refactored"."dim_user_refactored"
 union all
 select -1,'unknown','admin','1999-01-01','IAMR:dev-dap-redshift-processing-role','1999-01-01';

CREATE VIEW conformed_refactored.vw_dim_user_journey_event_refactored
AS
SELECT
    *
FROM
    "dap_txma_reporting_db_refactored"."conformed_refactored"."dim_user_journey_event_refactored"
 union all
 select -1,'unknown','admin','1999-01-01','IAMR:dev-dap-redshift-processing-role','1999-01-01';   


CREATE VIEW conformed_refactored.vw_dim_journey_channel_refactored
AS
SELECT
    *
FROM
    "dap_txma_reporting_db_refactored"."conformed_refactored"."dim_journey_channel_refactored"
 union all
 select -1,'unknown','unknown','admin','1999-01-01','IAMR:dev-dap-redshift-processing-role','1999-01-01';        