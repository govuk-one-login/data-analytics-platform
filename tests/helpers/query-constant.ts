import { productFamily } from './common-helpers';

export const DIM_DATE_COLUMNS =
  'SELECT\n' +
  '   date_key,date,day_suffix,Weekday,Weekday_name,Weekday_name_short,Day_of_week_in_month,Day_of_year,Week_of_year,Month,Month_name,Month_name_short,Quarter,Quarter_name,Year,Is_Weekend,Created_by,Created_date,Modified_by,Modified_date,Batch_id\n' +
  'FROM\n' +
  '    "dap_txma_reporting_db"."conformed"."dim_date"';

export const DIM_EVENT_COLUMNS =
  'select event_name,product_family,event_description,event_journey_type, created_by,created_date,modified_by,batch_id from dap_txma_reporting_db.conformed.dim_event';

export const DIM_EVENT_BY_NAME =
  'select\n' +
  '    event_name,event_journey_type\n' +
  'FROM\n' +
  '    "dap_txma_reporting_db"."conformed"."dim_event" where product_family=';

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

export const EVENT_BY_FAMILY =
  'select dd.date,de.event_name,de.product_family,de.service_name,djc.channel_name,\n' +
  'dvr.verification_route_name ,fct.user_id,fct.event_id,fct.event_time,fct.journey_id,fct.component_id\n' +
  'FROM\n' +
  ' "dap_txma_reporting_db"."conformed"."fact_user_journey_event" fct\n' +
  'JOIN  "dap_txma_reporting_db"."conformed".dim_date dd ON fct.date_key= dd.date_key\n' +
  'LEFT JOIN  "dap_txma_reporting_db"."conformed".DIM_EVENT DE ON fct.event_key = de.event_key\n' +
  'LEFT JOIN  "dap_txma_reporting_db"."conformed".dim_journey_channel djc ON fct.journey_channel_key = djc.journey_channel_key\n' +
  'LEFT JOIN  "dap_txma_reporting_db"."conformed".dim_relying_party drp ON fct.relying_party_key = drp.relying_party_key\n' +
  'LEFT JOIN  "dap_txma_reporting_db"."conformed".dim_verification_route dvr ON fct.verification_route_key = dvr.verification_route_key\n' +
  'WHERE de.product_family=';

export const DISTINCT_EVENT_NAME = 'SELECT distinct event_name FROM ';

export const PROCESSED_EVENT_BY_NAME =
  'select dd.date,de.event_name,de.product_family,\n' +
  'fct.user_id,fct.event_id,fct.event_time,fct.processed_date\n' +
  'FROM\n' +
  ' "dap_txma_reporting_db"."conformed"."fact_user_journey_event" fct\n' +
  'JOIN  "dap_txma_reporting_db"."conformed".dim_date dd ON fct.date_key= dd.date_key\n' +
  'LEFT JOIN  "dap_txma_reporting_db"."conformed".DIM_EVENT DE ON fct.event_key = de.event_key\n' +
  'WHERE  event_name =';

export const FACT_TABLE_EVENT_PROCESSED_TODAY =
  'SELECT\n' +
  '    *\n' +
  'FROM\n' +
  '    "dap_txma_reporting_db"."conformed"."fact_user_journey_event" where processed_date=';

export const AUTH_CODE_VERIFIED_DATA =
  'SELECT event_id,extensions,day FROM auth_code_verified where extensions is not null';

export const AUTH_ACCOUNT_MFA_DATA = (eventname: string): string => {
  const query =
    "SELECT event_id, extensions_notificationtype,extensions_mfatype, extensions_accountrecovery FROM auth_account_mfa where event_name='" +
    eventname +
    "'";
  return query;
};

export const AUTH_AUTHORISATION_DATA = (eventname: string): string => {
  const query =
    "SELECT event_id, extensions_clientname,extensions_description, extensions_clientlandingpageurl FROM auth_account_mfa where event_name='" +
    eventname +
    "'";
  return query;
};

export const IPV_JOURNEY_DATA = (eventname: string): string => {
  const query =
    "SELECT event_id, extensions_hasmitigations,extensions_levelofconfidence, extensions_cifail FROM IPV_JOURNEY where event_name='" +
    eventname +
    "'";
  return query;
};

export const IPV_CRI_F2F_DATA = (eventname: string): string => {
  const query =
    "SELECT event_id, extensions_evidence,extensions_iss, extensions_successful, extensions_previousgovuksigninjourneyid, restricted_passport, restricted_residencepermit, restricted_drivingpermit, restricted_idcard, user_user_id, user_govuk_signin_journey_id FROM IPV_CRI_F2F where event_name='" +
    eventname +
    "'";
  return query;
};

export const GET_EVENT_ID = (eventname: string): string => {
  const query =
    'SELECT event_id FROM ' +
    productFamily(eventname) +
    " where event_name='" +
    eventname +
    "' order by processed_date desc limit 10;";
  return query;
};

export const extensionsnotnullquery = (tablename: string): string => {
  const query = 'SELECT event_id,extensions,day FROM ' + tablename + ' where extensions is not null';
  return query;
};
export const usernotnullquery = (tablename: string): string => {
  const query = 'SELECT event_id,user,day FROM ' + tablename + ' where user is not null';
  return query;
};
export const restrictednotnullquery = (tablename: string): string => {
  const query = 'SELECT event_id,	restricted,day FROM ' + tablename + ' where restricted is not null';
  return query;
};

export const IPV_IDENTITY_ISSUED_CONFORMED =
  'select event_id,event_name,has_mitigations,level_of_confidence,ci_fail FROM\n' +
  '  "dap_txma_reporting_db"."conformed"."fact_user_journey_event" fct  LEFT JOIN  "dap_txma_reporting_db"."conformed".DIM_EVENT DE ON fct.event_key = de.event_key WHERE ';
