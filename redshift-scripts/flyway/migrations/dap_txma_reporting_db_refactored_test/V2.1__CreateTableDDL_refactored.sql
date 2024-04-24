CREATE TABLE conformed_refactored.dim_date_refactored (
    date_key integer NOT NULL ENCODE raw
    distkey
,
        date date ENCODE az64,
        day character varying(50) ENCODE lzo,
        day_suffix character varying(50) ENCODE lzo,
        weekday character varying(50) ENCODE lzo,
        weekday_name character varying(50) ENCODE lzo,
        weekday_name_short character varying(10) ENCODE lzo,
        day_of_week_in_month character varying(50) ENCODE lzo,
        day_of_year character varying(10) ENCODE lzo,
        week_of_year character varying(10) ENCODE lzo,
        month character varying(50) ENCODE lzo,
        month_name character varying(50) ENCODE lzo,
        month_name_short character varying(10) ENCODE lzo,
        quarter character varying(50) ENCODE lzo,
        quarter_name character varying(50) ENCODE lzo,
        year character varying(10) ENCODE lzo,
        is_weekend character(1) ENCODE lzo,
        created_by character varying(100) ENCODE lzo,
        created_date date ENCODE az64,
        modified_by character varying(100) ENCODE lzo,
        modified_date date ENCODE az64,
        batch_id integer ENCODE az64,
        PRIMARY KEY (date_key)
) DISTSTYLE KEY
SORTKEY
    (date_key);


CREATE TABLE conformed_refactored.dim_event_refactored (
    event_key integer NOT NULL identity(1, 1) ENCODE raw
    distkey
,
        event_name character varying(500) ENCODE lzo,
        created_by character varying(100) ENCODE lzo,
        created_date date ENCODE az64,
        modified_by character varying(100) ENCODE lzo,
        modified_date date ENCODE az64,
        PRIMARY KEY (event_key)
) 
SORTKEY
    (event_key);


CREATE TABLE conformed_refactored.dim_journey_channel_refactored (
    journey_channel_key integer NOT NULL identity(1, 1) ENCODE raw
    distkey
,
        channel_name character varying(100) ENCODE lzo,
        channel_description character varying(100) ENCODE lzo,
        created_by character varying(100) ENCODE lzo,
        created_date date ENCODE az64,
        modified_by character varying(100) ENCODE lzo,
        modified_date date ENCODE az64,
        PRIMARY KEY (journey_channel_key)
) DISTSTYLE KEY
SORTKEY
    (journey_channel_key);

CREATE TABLE conformed_refactored.dim_relying_party_refactored (
    relying_party_key integer NOT NULL identity(1, 1) ENCODE raw
    distkey
,
        client_id character varying(1000) ENCODE lzo,
        relying_party_name character varying(1000) ENCODE lzo,
        display_name character varying(1000) ENCODE lzo,
        created_by character varying(100) ENCODE lzo,
        created_date date ENCODE az64,
        modified_by character varying(100) ENCODE lzo,
        modified_date date ENCODE az64,
        PRIMARY KEY (relying_party_key)
) DISTSTYLE KEY
SORTKEY
    (relying_party_key);


CREATE TABLE conformed_refactored.dim_user_journey_event_refactored (
    user_journey_key integer NOT NULL identity(1, 1) ENCODE raw
    distkey
,
        user_govuk_signin_journey_id character varying(500) ENCODE lzo,
        created_by character varying(100) ENCODE lzo,
        created_date date ENCODE az64,
        modified_by character varying(100) ENCODE lzo,
        modified_date date ENCODE az64,
        PRIMARY KEY (user_journey_key)
) DISTSTYLE KEY
SORTKEY
    (user_journey_key);


CREATE TABLE conformed_refactored.dim_user_refactored (
    user_key integer NOT NULL identity(1, 1) ENCODE raw
    distkey
,
        user_id character varying(500) ENCODE lzo,
        created_by character varying(100) ENCODE lzo,
        created_date date ENCODE az64,
        modified_by character varying(100) ENCODE lzo,
        modified_date date ENCODE az64,
        PRIMARY KEY (user_key)
) DISTSTYLE KEY
SORTKEY
    (user_key);


CREATE TABLE conformed_refactored.event_extensions_refactored (
    user_journey_event_key integer ENCODE az64
    distkey
,
        parent_attribute_name character varying(10000) ENCODE lzo,
        event_attribute_name character varying(10000) ENCODE lzo,
        event_attribute_value character varying(10000) ENCODE lzo,
        event_id character varying(10000) ENCODE lzo,
        created_by character varying(100) ENCODE lzo,
        created_date date ENCODE az64,
        modified_by character varying(100) ENCODE lzo,
        modified_date date ENCODE az64
) DISTSTYLE KEY;


CREATE TABLE conformed_refactored.fact_user_journey_event_refactored (
    user_journey_event_key integer NOT NULL identity(1, 1) ENCODE raw,
    event_key integer NOT NULL ENCODE az64,
    date_key integer NOT NULL ENCODE az64,
    user_key integer NOT NULL ENCODE az64,
    journey_channel_key integer NOT NULL ENCODE az64,
    relying_party_key integer NOT NULL ENCODE az64,
    user_journey_key integer NOT NULL ENCODE az64,
    event_id character varying(100) ENCODE lzo
    distkey
,
        event_time character varying(1000) ENCODE lzo,
        component_id character varying(100) ENCODE bytedict,
        event_count integer ENCODE az64,
        processed_date character varying(100) ENCODE lzo,
        created_by character varying(100) ENCODE lzo,
        created_date date ENCODE az64,
        modified_by character varying(100) ENCODE lzo,
        modified_date date ENCODE az64,
        PRIMARY KEY (user_journey_event_key),
        UNIQUE (event_id),
        FOREIGN KEY (event_key) REFERENCES conformed_refactored.dim_event_refactored(event_key),
        FOREIGN KEY (date_key) REFERENCES conformed_refactored.dim_date_refactored(date_key),
        FOREIGN KEY (user_key) REFERENCES conformed_refactored.dim_user_refactored(user_key),
        FOREIGN KEY (journey_channel_key) REFERENCES conformed_refactored.dim_journey_channel_refactored(journey_channel_key),
        FOREIGN KEY (relying_party_key) REFERENCES conformed_refactored.dim_relying_party_refactored(relying_party_key),
        FOREIGN KEY (user_journey_key) REFERENCES conformed_refactored.dim_user_journey_event_refactored(user_journey_key)
) DISTSTYLE KEY
SORTKEY
    (user_journey_event_key);


/*CREATE TABLE conformed.ref_events_refactored (
    event_name character varying(1000) ENCODE lzo,
    insert_timestamp timestamp without time zone ENCODE az64,
    max_run_date date ENCODE az64
) DISTSTYLE AUTO;*/

CREATE TABLE conformed_refactored.batch_events_refactored (
    event_name character varying(1000) ENCODE lzo,
    insert_timestamp timestamp without time zone ENCODE az64,
    max_run_date date ENCODE az64,
    event_active int default  1
) DISTSTYLE AUTO;

--alter table "dap_txma_reporting_db_refactored"."conformed_refactored"."batch_events_refactored" 
--add column event_active int default  1;


CREATE TABLE conformed_refactored.ref_relying_parties_refactored (
    ref_relying_partie_key integer identity(1, 1) ENCODE az64,
    client_id character varying(1000) ENCODE lzo,
    client_name character varying(1000) ENCODE lzo,
    display_name character varying(1000) ENCODE lzo
) DISTSTYLE AUTO;


create table audit_refactored.audit_procedure_status
(step_number int,Procedure_name varchar(1000),running_status varchar(1000),procedure_start_date TIMESTAMP,procedure_end_date TIMESTAMP);

