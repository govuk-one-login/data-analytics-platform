CREATE OR REPLACE PROCEDURE audit.sp_audit_data_objects() 
AS $$ 
BEGIN 


  CREATE TABLE audit.err_duplicate_event_id_auth_account_creation_1 (
    product_family varchar(100),
    total_duplicate_event_count_minus_one int,
    event_name varchar(1000),
    event_id varchar(1000),
    timestamp_formatted varchar(100),
    created_by varchar(100),
    created_datetime date
  );

  CREATE TABLE audit.err_duplicate_event_id_auth_orchestration_2 (
    product_family varchar(100),
    total_duplicate_event_count_minus_one int,
    event_name varchar(1000),
    event_id varchar(1000),
    timestamp_formatted varchar(100),
    created_by varchar(100),
    created_datetime date
  );

  CREATE TABLE audit.err_duplicate_event_id_auth_account_user_login_3 (
    product_family varchar(100),
    total_duplicate_event_count_minus_one int,
    event_name varchar(1000),
    event_id varchar(1000),
    timestamp_formatted varchar(100),
    created_by varchar(100),
    created_datetime date
  );

  CREATE TABLE audit.err_duplicate_event_id_dcmaw_cri_4 (
    product_family varchar(100),
    total_duplicate_event_count_minus_one int,
    event_name varchar(1000),
    event_id varchar(1000),
    timestamp_formatted varchar(100),
    created_by varchar(100),
    created_datetime date
  );

  CREATE TABLE audit.err_duplicate_event_id_auth_account_mfa_5 (
    product_family varchar(100),
    total_duplicate_event_count_minus_one int,
    event_name varchar(1000),
    event_id varchar(1000),
    timestamp_formatted varchar(100),
    created_by varchar(100),
    created_datetime date
  );

  CREATE TABLE audit.err_duplicate_event_id_auth_account_management_6 (
    product_family varchar(100),
    total_duplicate_event_count_minus_one int,
    event_name varchar(1000),
    event_id varchar(1000),
    timestamp_formatted varchar(100),
    created_by varchar(100),
    created_datetime date
  );

  CREATE TABLE audit.err_duplicate_event_id_ipv_cri_address_7 (
    product_family varchar(100),
    total_duplicate_event_count_minus_one int,
    event_name varchar(1000),
    event_id varchar(1000),
    timestamp_formatted varchar(100),
    created_by varchar(100),
    created_datetime date
  );

  CREATE TABLE audit.err_duplicate_event_id_ipv_cri_driving_license_8 (
    product_family varchar(100),
    total_duplicate_event_count_minus_one int,
    event_name varchar(1000),
    event_id varchar(1000),
    timestamp_formatted varchar(100),
    created_by varchar(100),
    created_datetime date
  );

  CREATE TABLE audit.err_duplicate_event_id_ipv_cri_fraud_9 (
    product_family varchar(100),
    total_duplicate_event_count_minus_one int,
    event_name varchar(1000),
    event_id varchar(1000),
    timestamp_formatted varchar(100),
    created_by varchar(100),
    created_datetime date
  );

  CREATE TABLE audit.err_duplicate_event_id_ipv_journey_10 (
    product_family varchar(100),
    total_duplicate_event_count_minus_one int,
    event_name varchar(1000),
    event_id varchar(1000),
    timestamp_formatted varchar(100),
    created_by varchar(100),
    created_datetime date
  );

  CREATE TABLE audit.err_duplicate_event_id_ipv_cri_kbv_11 (
    product_family varchar(100),
    total_duplicate_event_count_minus_one int,
    event_name varchar(1000),
    event_id varchar(1000),
    timestamp_formatted varchar(100),
    created_by varchar(100),
    created_datetime date
  );

  CREATE TABLE audit.err_duplicate_event_id_ipv_cri_passport_12 (
    product_family varchar(100),
    total_duplicate_event_count_minus_one int,
    event_name varchar(1000),
    event_id varchar(1000),
    timestamp_formatted varchar(100),
    created_by varchar(100),
    created_datetime date
  );


raise info 'Setup of audit layer ran successfully';

EXCEPTION WHEN OTHERS THEN 
  RAISE EXCEPTION '[Error while setting up audit layer] Exception: %',sqlerrm;

END;

$$ language plpgsql;