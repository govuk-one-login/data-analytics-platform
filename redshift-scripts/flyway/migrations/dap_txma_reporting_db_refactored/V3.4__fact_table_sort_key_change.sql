CREATE TABLE conformed_refactored.fact_user_journey_event_refactored_new (
    user_journey_event_key integer NOT NULL identity(1, 1) ENCODE raw,
    event_key integer NOT NULL ENCODE az64,
    date_key integer NOT NULL ENCODE az64,
    user_key integer NOT NULL ENCODE az64,
    journey_channel_key integer NOT NULL ENCODE az64,
    relying_party_key integer NOT NULL ENCODE az64,
    user_journey_key integer NOT NULL ENCODE az64,
    event_id character varying(100) ENCODE lzo,
    event_time character varying(1000) ENCODE lzo,
    component_id character varying(100) ENCODE bytedict,
    event_count integer ENCODE az64,
    processed_date character varying(100) ENCODE lzo
    distkey
,
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
    (date_key, processed_date);

insert into conformed_refactored.fact_user_journey_event_refactored_new
(event_key,date_key,user_key,journey_channel_key,relying_party_key,user_journey_key,event_id,event_time,component_id,
event_count,processed_date,created_by,created_date,modified_by,modified_date)
select event_key,date_key,user_key,journey_channel_key,relying_party_key,user_journey_key,event_id,event_time,component_id,
event_count,processed_date,created_by,created_date,modified_by,modified_date
from conformed_refactored.fact_user_journey_event_refactored;    


alter table "conformed_refactored"."fact_user_journey_event_refactored"
rename to fact_user_journey_event_refactored_with_old_sort_key;


alter table "conformed_refactored"."fact_user_journey_event_refactored_new"
rename to fact_user_journey_event_refactored;