CREATE TABLE conformed_refactored.batch_events_refactored_test (
    event_name character varying(1000) ENCODE lzo,
    insert_timestamp timestamp without time zone ENCODE az64,
    max_run_date date ENCODE az64,
    event_active int default  1
) DISTSTYLE AUTO;