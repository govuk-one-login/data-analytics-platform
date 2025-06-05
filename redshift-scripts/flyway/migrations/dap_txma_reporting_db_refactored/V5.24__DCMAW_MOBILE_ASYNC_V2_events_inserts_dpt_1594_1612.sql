-- Insert DCMAW_ASYNC_HYBRID_BILLING_STARTED if it doesn't exist
INSERT INTO conformed_refactored.batch_events_refactored (event_name, insert_timestamp, max_run_date)
SELECT 'DCMAW_ASYNC_HYBRID_BILLING_STARTED', sysdate, '1999-01-01'
WHERE NOT EXISTS (
    SELECT 1
    FROM conformed_refactored.batch_events_refactored
    WHERE event_name = 'DCMAW_ASYNC_HYBRID_BILLING_STARTED'
);


-- Insert DCMAW_ASYNC_IPROOV_BILLING_STARTED if it doesn't exist
INSERT INTO conformed_refactored.batch_events_refactored (event_name, insert_timestamp, max_run_date)
SELECT 'DCMAW_ASYNC_IPROOV_BILLING_STARTED', sysdate, '1999-01-01'
WHERE NOT EXISTS (
    SELECT 1
    FROM conformed_refactored.batch_events_refactored
    WHERE event_name = 'DCMAW_ASYNC_IPROOV_BILLING_STARTED'
);

-- Insert DCMAW_ASYNC_READID_NFC_BILLING_STARTED if it doesn't exist
INSERT INTO conformed_refactored.batch_events_refactored (event_name, insert_timestamp, max_run_date)
SELECT 'DCMAW_ASYNC_READID_NFC_BILLING_STARTED', sysdate, '1999-01-01'
WHERE NOT EXISTS (
    SELECT 1
    FROM conformed_refactored.batch_events_refactored
    WHERE event_name = 'DCMAW_ASYNC_READID_NFC_BILLING_STARTED'
);


-- Insert DCMAW_ASYNC_ABORT_APP if it doesn't exist
INSERT INTO conformed_refactored.batch_events_refactored (event_name, insert_timestamp, max_run_date)
SELECT 'DCMAW_ASYNC_ABORT_APP', sysdate, '1999-01-01'
WHERE NOT EXISTS (
    SELECT 1
    FROM conformed_refactored.batch_events_refactored
    WHERE event_name = 'DCMAW_ASYNC_ABORT_APP'
);

-- Insert DCMAW_ASYNC_CRI_END if it doesn't exist
INSERT INTO conformed_refactored.batch_events_refactored (event_name, insert_timestamp, max_run_date)
SELECT 'DCMAW_ASYNC_CRI_END', sysdate, '1999-01-01'
WHERE NOT EXISTS (
    SELECT 1
    FROM conformed_refactored.batch_events_refactored
    WHERE event_name = 'DCMAW_ASYNC_CRI_END'
);

-- Insert DCMAW_ASYNC_CRI_START if it doesn't exist
INSERT INTO conformed_refactored.batch_events_refactored (event_name, insert_timestamp, max_run_date)
SELECT 'DCMAW_ASYNC_CRI_START', sysdate, '1999-01-01'
WHERE NOT EXISTS (
    SELECT 1
    FROM conformed_refactored.batch_events_refactored
    WHERE event_name = 'DCMAW_ASYNC_CRI_START'
);

-- Insert DCMAW_ASYNC_CRI_ERROR if it doesn't exist
INSERT INTO conformed_refactored.batch_events_refactored (event_name, insert_timestamp, max_run_date)
SELECT 'DCMAW_ASYNC_CRI_ERROR', sysdate, '1999-01-01'
WHERE NOT EXISTS (
    SELECT 1
    FROM conformed_refactored.batch_events_refactored
    WHERE event_name = 'DCMAW_ASYNC_CRI_ERROR'
);