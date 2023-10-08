CREATE TABLE audit.err_duplicate_event_id_ipv_cri_cic_13 (
    product_family character varying(100) ENCODE lzo,
    total_duplicate_event_count_minus_one integer ENCODE az64,
    event_name character varying(1000) ENCODE lzo,
    event_id character varying(1000) ENCODE lzo,
    timestamp_formatted character varying(100) ENCODE lzo,
    created_by character varying(100) ENCODE lzo,
    created_datetime date ENCODE az64
) DISTSTYLE AUTO;