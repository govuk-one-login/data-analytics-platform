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
    --
    CREATE TABLE IF NOT EXISTS conformed.ref_events (
        event_name varchar(1000),
        product_family varchar(1000),
        domain varchar(1000),
        sub_domain varchar(1000),
        other_sub_domain varchar(1000)
    ) diststyle auto sortkey auto encode auto;  
    --
    TRUNCATE conformed.ref_events;
    --
    INSERT INTO conformed.ref_events (event_name, product_family, domain, sub_domain, other_sub_domain)
    VALUES
    ('AUTH_AUTHORISATION_INITIATED','AUTH_ORCHESTRATION','Authentication','Relying Parties Connect',' '),
    ('AUTH_CHECK_USER_KNOWN_EMAIL','AUTH_ACCOUNT_USER_LOGIN','Authentication','User Login',' '),
    ('AUTH_CHECK_USER_NO_ACCOUNT_WITH_EMAIL','AUTH_ACCOUNT_CREATION','Authentication','Account Creation',' '),
    ('AUTH_CODE_VERIFIED','AUTH_ACCOUNT_MFA','Authentication','Account MFA',' '),
    ('AUTH_CREATE_ACCOUNT','AUTH_ACCOUNT_CREATION','Authentication','Account Creation',' '),
    ('AUTH_LOG_IN_SUCCESS','AUTH_ACCOUNT_USER_LOGIN','Authentication','User Login',' '),
    ('AUTH_PASSWORD_RESET_SUCCESSFUL','AUTH_ACCOUNT_MANAGEMENT','Authentication','Account Management',' '),
    ('DCMAW_APP_END','DCMAW_CRI','DCMAW','App Journey',' '),
    ('DCMAW_APP_HANDOFF_START','DCMAW_CRI','DCMAW','App Journey',' '),
    ('DCMAW_APP_START','DCMAW_CRI','DCMAW','App Journey',' '),
    ('DCMAW_CRI_START','DCMAW_CRI','DCMAW','CRI',' '),
    ('DCMAW_CRI_VC_ISSUED','DCMAW_CRI','DCMAW','CRI',' '),
    ('DCMAW_DRIVING_LICENCE_SELECTED','DCMAW_CRI','DCMAW','CRI',' '),
    ('DCMAW_PASSPORT_SELECTED','DCMAW_CRI','DCMAW','CRI',' '),
    ('DCMAW_WEB_END','DCMAW_CRI','DCMAW','APP Journey',' '),
    ('IPV_ADDRESS_CRI_START','IPV_CRI_ADDRESS','IPV','Address CRI',' '),
    ('IPV_ADDRESS_CRI_VC_ISSUED','IPV_CRI_ADDRESS','IPV','Address CRI',' '),
    ('IPV_DL_CRI_START','IPV_CRI_DRIVING_LICENSE ','IPV','Driving License',' '),
    ('IPV_DL_CRI_VC_ISSUED','IPV_CRI_DRIVING_LICENSE ','IPV','Driving License',' '),
    ('IPV_FRAUD_CRI_START','IPV_CRI_FRAUD','IPV','Fraud CRI',' '),
    ('IPV_FRAUD_CRI_VC_ISSUED','IPV_CRI_FRAUD','IPV','Fraud CRI',' '),
    ('IPV_IDENTITY_REUSE_COMPLETE','IPV_JOURNEY','IPV','IPV Journey',' '),
    ('IPV_IDENTITY_REUSE_RESET','IPV_JOURNEY','IPV','IPV Journey',''),
    ('IPV_JOURNEY_END','IPV_JOURNEY','IPV','IPV Journey',' '),
    ('IPV_JOURNEY_START','IPV_JOURNEY','IPV','IPV Journey',' '),
    ('IPV_KBV_CRI_START','IPV_CRI_KBV','IPV','KBV CRI',' '),
    ('IPV_KBV_CRI_VC_ISSUED','IPV_CRI_KBV','IPV','KBV CRI',' '),
    ('IPV_PASSPORT_CRI_START','IPV_CRI_PASSPORT','IPV','Passport CRI',' '),
    ('IPV_PASSPORT_CRI_VC_ISSUED','IPV_CRI_PASSPORT','IPV','Passport CRI',' '),
    ('IPV_SPOT_RESPONSE_APPROVED','IPV_JOURNEY','IPV','IPV Journey','SPOT'),
    ('IPV_SPOT_RESPONSE_REJECTED','IPV_JOURNEY','IPV','IPV Journey','SPOT');

    raise info 'Setup of conformed layer ran successfully';

EXCEPTION WHEN OTHERS THEN 
    RAISE EXCEPTION'[Error while setting up conformed layer] Exception: %',sqlerrm;

END;

$$ language plpgsql;