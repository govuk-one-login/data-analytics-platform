-- Batch 5 is part of missing 11 events. Below are 8 3 were already ingested as part of earlier batches.
insert into conformed_refactored.batch_events_refactored (event_name,insert_timestamp,max_run_date) values ('AUTH_ACCOUNT_TEMPORARILY_LOCKED',sysdate,'1999-01-01');
insert into conformed_refactored.batch_events_refactored (event_name,insert_timestamp,max_run_date) values ('AUTH_REAUTHENTICATION_SUCCESSFUL',sysdate,'1999-01-01');
insert into conformed_refactored.batch_events_refactored (event_name,insert_timestamp,max_run_date) values ('AUTH_REAUTHENTICATION_INVALID',sysdate,'1999-01-01');
insert into conformed_refactored.batch_events_refactored (event_name,insert_timestamp,max_run_date) values ('IPV_SUBJOURNEY_START',sysdate,'1999-01-01');
insert into conformed_refactored.batch_events_refactored (event_name,insert_timestamp,max_run_date) values ('IPV_CONTRA_INDICATOR_STORAGE_PUT_NEW_MITIGATION',sysdate,'1999-01-01');
insert into conformed_refactored.batch_events_refactored (event_name,insert_timestamp,max_run_date) values ('AUTH_PASSWORD_RESET_REQUESTED',sysdate,'1999-01-01');
insert into conformed_refactored.batch_events_refactored (event_name,insert_timestamp,max_run_date) values ('HOME_REPORT_SUSPICIOUS_ACTIVITY',sysdate,'1999-01-01');
insert into conformed_refactored.batch_events_refactored (event_name,insert_timestamp,max_run_date) values ('AUTH_AUTHENTICATION_COMPLETE',sysdate,'1999-01-01');