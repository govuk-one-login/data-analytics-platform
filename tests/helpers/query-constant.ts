export const DIM_DATE_COLUMNS =
  'SELECT\n' +
  '   date_key,date,day_suffix,Weekday,Weekday_name,Weekday_name_short,Day_of_week_in_month,Day_of_year,Week_of_year,Month,Month_name,Month_name_short,Quarter,Quarter_name,Year,Is_Weekend,Created_by,Created_date,Modified_by,Modified_date,Batch_id\n' +
  'FROM\n' +
  '    "dap_txma_reporting_db"."conformed"."dim_date"';

export const DIM_EVENT_COLUMNS =
  'select event_name,product_family,event_description,event_journey_type, created_by,created_date,modified_by,batch_id from dap_txma_reporting_db.conformed.dim_event';

export  const DIM_EVENT_BY_NAME='select\n' +
  '    event_name,event_journey_type\n' +
  'FROM\n' +
  '    "dap_txma_reporting_db"."conformed"."dim_event" where product_family='

export const DIM_RELYING_PARTY_COLUMNS =
  'select client_id, relying_party_name,relying_party_description ,created_by,created_date,modified_by,modified_date,batch_id,relying_party_key from dap_txma_reporting_db.conformed.dim_relying_party';

export const DIM_VERIFICATION_ROUTE =
  'select verification_route_key, ' +
  'verification_route_name,verification_short_name,route_description,created_by,created_date ,modified_by , modified_date ,batch_id \n' +
  'FROM "dap_txma_reporting_db"."conformed"."dim_verification_route";';

export const DIM_JOURNEY_CHANNEL =
  'select journey_channel_key,channel_name,channel_description,created_by,created_date ,modified_by,modified_date,batch_id FROM dap_txma_reporting_db.conformed.dim_journey_channel';

export const FACT_USER_JOURNEY_EVENT =
  'SELECT user_journey_event_key,event_key,date_key ' +
  ',verification_route_key,journey_channel_key, relying_party_key,user_id,event_id,event_time,journey_id,component_id,event_count, rejection_reason,reason,notification_type,mfa_type,account_recovery,\n' +
  '        failed_check_details_biometric_verification_process_level,\n' +
  '        check_details_biometric_verification_process_level,\n' +
  '        addresses_entered,\n' +
  '        activity_history_score,\n' +
  '        identity_fraud_score,\n' +
  '        decision_score,\n' +
  '        failed_check_details_kbv_response_mode,\n' +
  '        failed_check_details_check_method,\n' +
  '        check_details_kbv_response_model ,\n' +
  '        check_details_kbv_quality ,\n' +
  '        verification_score,\n' +
  '        strength_score,\n' +
  '        check_details_check_method,\n' +
  '        iss,\n' +
  '        validity_score,\n' +
  '        type,\n' +
  '        processed_date,\n' +
  '        created_by,\n' +
  '        created_date ,\n' +
  '        modified_by,\n' +
  '        modified_date,\n' +
  '        batch_id \n' +
  'FROM "dap_txma_reporting_db"."conformed"."fact_user_journey_event"';
