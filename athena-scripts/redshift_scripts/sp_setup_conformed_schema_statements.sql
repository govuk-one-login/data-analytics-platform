CREATE OR REPLACE PROCEDURE conformed.sp_setup_conformed_schema() 
AS $$ 
BEGIN 

    CREATE TABLE IF NOT EXISTS conformed.batchcontrol (
        product_family varchar(100) NOT NULL,
        maxrundate datetime
    ) diststyle auto sortkey auto encode auto;
    --
    CREATE TABLE IF NOT EXISTS conformed.dim_event (
        event_key int identity(1, 1),
        event_name varchar(500),
        product_family varchar(1000),
        event_description varchar(500),
        event_journey_type varchar(100),
        service_name varchar(100),
        created_by varchar(100),
        created_date date,
        modified_by varchar(100),
        modified_date date,
        batch_id integer,
        PRIMARY KEY (event_key)
    ) diststyle auto sortkey auto encode auto;
    --
    CREATE TABLE IF NOT EXISTS conformed.dim_date (
        date_key int,
        date date,
        DAY varchar(50),
        day_suffix varchar(50),
        weekday varchar(50),
        weekday_name varchar(50),
        weekday_name_short varchar(10),
        day_of_week_in_month varchar(50),
        day_of_year varchar(10),
        week_of_year varchar(10),
        MONTH varchar(50),
        month_name varchar(50),
        month_name_short varchar(10),
        quarter varchar(50),
        quarter_name varchar(50),
        year varchar(10),
        is_weekend char(1),
        created_by varchar(100),
        created_date date,
        modified_by varchar(100),
        modified_date date,
        batch_id integer,
        PRIMARY KEY (date_key)
    ) diststyle auto sortkey auto encode auto;
    --
    CREATE TABLE IF NOT EXISTS conformed.dim_journey_channel (
        journey_channel_key int identity (1, 1),
        channel_name varchar(100),
        channel_description varchar(100),
        created_by varchar(100),
        created_date date,
        modified_by varchar(100),
        modified_date date,
        batch_id integer,
        PRIMARY KEY (journey_channel_key)
    ) diststyle auto sortkey auto encode auto;
    --
    CREATE TABLE IF NOT EXISTS conformed.dim_relying_party (
        relying_party_key int identity (1, 1),
        client_name varchar(1000),
        relying_party_name varchar(50),
        relying_party_description varchar(50),
        created_by varchar(100),
        created_date date,
        modified_by varchar(100),
        modified_date date,
        batch_id integer,
        PRIMARY KEY (relying_party_key)
    ) diststyle auto sortkey auto encode auto;
    --
    CREATE TABLE IF NOT EXISTS conformed.dim_verification_route (
        verification_route_key int identity(1, 1),
        verification_route_name varchar(500),
        verification_short_name varchar(50),
        route_description varchar(500),
        created_by varchar(100),
        created_date date,
        modified_by varchar(100),
        modified_date date,
        batch_id integer,
        PRIMARY KEY (verification_route_key)
    ) diststyle auto sortkey auto encode auto;
    --
    CREATE TABLE IF NOT EXISTS conformed.fact_user_journey_event (
        user_journey_event_key int identity(1, 1),
        event_key integer NOT NULL,
        date_key integer NOT NULL,
        verification_route_key integer NOT NULL,
        journey_channel_key integer NOT NULL,
        relying_party_key integer NOT NULL,
        user_id varchar(100),
        event_id varchar(100) UNIQUE,
        event_time varchar(1000),
        journey_id varchar(100),
        component_id varchar(100),
        event_count integer,
        rejection_reason varchar(50),
        reason varchar(50),
        notification_type varchar(50),
        mfa_type varchar(50),
        account_recovery varchar(50),
        failed_check_details_biometric_verification_process_level varchar(50),
        check_details_biometric_verification_process_level varchar(50),
        addresses_entered varchar(50),
        activity_history_score varchar(50),
        identity_fraud_score varchar(50),
        decision_score varchar(50),
        failed_check_details_kbv_response_mode varchar(50),
        failed_check_details_check_method varchar(50),
        check_details_kbv_response_model varchar(50),
        check_details_kbv_quality varchar(50),
        verification_score varchar(50),
        check_details_check_method varchar(50),
        iss varchar(50),
        validity_score varchar(50),
        TYPE varchar(50),
        processed_date varchar(100),
        created_by varchar(100),
        created_date date,
        modified_by varchar(100),
        modified_date date,
        batch_id integer,
        PRIMARY KEY (user_journey_event_key),
        FOREIGN KEY (event_key) REFERENCES conformed.dim_event (event_key),
        FOREIGN KEY (date_key) REFERENCES conformed.dim_date (date_key),
        FOREIGN KEY (verification_route_key) REFERENCES conformed.dim_verification_route (verification_route_key),
        FOREIGN KEY (journey_channel_key) REFERENCES conformed.dim_journey_channel (journey_channel_key),
        FOREIGN KEY (relying_party_key) REFERENCES conformed.dim_relying_party (relying_party_key)
    ) diststyle auto sortkey auto encode auto;
    --
    CREATE TABLE IF NOT EXISTS conformed.err_duplicate_event_id (
        product_family varchar(100),
        event_count int,
        event_id varchar(1000),
        timestamp_formatted varchar(100),
        processed_date varchar(100),
        created_by varchar(100),
        created_datetime date
    ) diststyle auto sortkey auto encode auto;

    raise info 'Setup of conformed layer ran successfully';

exception
WHEN others THEN 
    raise exception '[Error while setting up conformed layer] Exception: %',sqlerrm;

END;

$$ language plpgsql;