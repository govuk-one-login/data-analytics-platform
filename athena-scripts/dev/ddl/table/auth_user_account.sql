CREATE EXTERNAL TABLE IF NOT EXISTS `${Environment}-txma-stage.auth_user_account` (
    event_id string,
    client_id string,
    component_id string,
    user_govuk_signin_journey_id string,
    user_user_id string,
    timestamp int,
    timestamp_formatted string,
    year int,
    month int,
    day int
)
PARTITIONED BY (processed_date int, event_name string)
STORED AS parquet
LOCATION 's3://${Environment}-dap-stage-layer/txma/auth_user_account/'