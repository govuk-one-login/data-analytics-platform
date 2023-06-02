CREATE EXTERNAL TABLE IF NOT EXISTS `stage-layer.auth_create_account` (
    event_id string,
    event_name string,
    client_id string,
    component_id string,
    timestamp int,
    timestamp_formatted string,
    user_user_id string,
    user_govuk_signin_journey_id string,
    year int,
    month int,
    day int
)
PARTITIONED BY (processed_date int)
STORED AS parquet
LOCATION 's3://563887642259-athena-processing-stage-layer-demo/txma/auth_create_account/'