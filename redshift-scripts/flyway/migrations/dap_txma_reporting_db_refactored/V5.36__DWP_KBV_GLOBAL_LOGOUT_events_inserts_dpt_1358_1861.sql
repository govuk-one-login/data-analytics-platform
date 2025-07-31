-- Insert IPV_DWP_KBV_CRI_START if it doesn't exist
INSERT INTO conformed_refactored.batch_events_refactored (event_name, insert_timestamp, max_run_date)
SELECT 'IPV_DWP_KBV_CRI_START', sysdate, '1999-01-01'
WHERE NOT EXISTS (
    SELECT 1
    FROM conformed_refactored.batch_events_refactored
    WHERE event_name = 'IPV_DWP_KBV_CRI_START'
);

-- Insert IPV_DWP_KBV_CRI_VC_ISSUED if it doesn't exist
INSERT INTO conformed_refactored.batch_events_refactored (event_name, insert_timestamp, max_run_date)
SELECT 'IPV_DWP_KBV_CRI_VC_ISSUED', sysdate, '1999-01-01'
WHERE NOT EXISTS (
    SELECT 1
    FROM conformed_refactored.batch_events_refactored
    WHERE event_name = 'IPV_DWP_KBV_CRI_VC_ISSUED'
);


-- Insert IPV_DWP_KBV_CRI_THIN_FILE_ENCOUNTERED if it doesn't exist
INSERT INTO conformed_refactored.batch_events_refactored (event_name, insert_timestamp, max_run_date)
SELECT 'IPV_DWP_KBV_CRI_THIN_FILE_ENCOUNTERED', sysdate, '1999-01-01'
WHERE NOT EXISTS (
    SELECT 1
    FROM conformed_refactored.batch_events_refactored
    WHERE event_name = 'IPV_DWP_KBV_CRI_THIN_FILE_ENCOUNTERED'
);

-- Insert IPV_DWP_KBV_CRI_ABANDONED if it doesn't exist
INSERT INTO conformed_refactored.batch_events_refactored (event_name, insert_timestamp, max_run_date)
SELECT 'IPV_DWP_KBV_CRI_ABANDONED', sysdate, '1999-01-01'
WHERE NOT EXISTS (
    SELECT 1
    FROM conformed_refactored.batch_events_refactored
    WHERE event_name = 'IPV_DWP_KBV_CRI_ABANDONED'
);




-- Insert HOME_GLOBAL_LOGOUT_REQUESTED if it doesn't exist
INSERT INTO conformed_refactored.batch_events_refactored (event_name, insert_timestamp, max_run_date)
SELECT 'HOME_GLOBAL_LOGOUT_REQUESTED', sysdate, '1999-01-01'
WHERE NOT EXISTS (
    SELECT 1
    FROM conformed_refactored.batch_events_refactored
    WHERE event_name = 'HOME_GLOBAL_LOGOUT_REQUESTED'
);


-- Insert AUTH_GLOBAL_LOG_OUT_SUCCESS if it doesn't exist
INSERT INTO conformed_refactored.batch_events_refactored (event_name, insert_timestamp, max_run_date)
SELECT 'AUTH_GLOBAL_LOG_OUT_SUCCESS', sysdate, '1999-01-01'
WHERE NOT EXISTS (
    SELECT 1
    FROM conformed_refactored.batch_events_refactored
    WHERE event_name = 'AUTH_GLOBAL_LOG_OUT_SUCCESS'
);