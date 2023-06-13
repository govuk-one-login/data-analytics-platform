CREATE EXTERNAL TABLE IF NOT EXISTS `environment-txma-stage.RELYING_PARTY` (
 event_id string,
 client_id string,
 component_id string,
 user_govuk_signin_journey_id string,
 user_user_id string,
 timestamp int,
 timestamp_formatted string,
 extensions_clientname string,
 extensions_description string,
 year int,
 month int,
 day int
)
PARTITIONED BY (processed_date int, event_name string)
STORED AS parquet
LOCATION 's3://environment-dap-stage-layer/txma/RELYING_PARTY/';