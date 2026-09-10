--DFT - Local Transport Data Collection

INSERT INTO conformed_refactored.REF_RELYING_PARTIES_refactored(CLIENT_ID,CLIENT_NAME,DISPLAY_NAME,department_name,agency_name) 
SELECT '3382C-WpmLG68IHdDxQ-xGVLvzo','Local Transport Data Collection','DFT - Local Transport Data Collectionlod','DFT','DFT'
WHERE NOT EXISTS (
    SELECT 1
    FROM conformed_refactored.REF_RELYING_PARTIES_refactored
    WHERE client_id = '3382C-WpmLG68IHdDxQ-xGVLvzo');


UPDATE conformed_refactored.dim_relying_party_refactored
SET relying_party_name = 'Local Transport Data Collection',
    display_name      = 'DFT - Local Transport Data Collection',
    department_name   = 'DFT',
    agency_name       = 'DFT'
WHERE client_id = '3382C-WpmLG68IHdDxQ-xGVLvzo';


--DHSC - Get Adult Social Care Data

INSERT INTO conformed_refactored.REF_RELYING_PARTIES_refactored(CLIENT_ID,CLIENT_NAME,DISPLAY_NAME,department_name,agency_name) 
SELECT 'LtOjB69ejHdOsQdT8rcBsL_D6BY','Get Adult Social Care Data','DHSC - Get Adult Social Care Data','DHSC','DHSC'
WHERE NOT EXISTS (
    SELECT 1
    FROM conformed_refactored.REF_RELYING_PARTIES_refactored
    WHERE client_id = 'LtOjB69ejHdOsQdT8rcBsL_D6BY');


UPDATE conformed_refactored.dim_relying_party_refactored
SET relying_party_name = 'Get Adult Social Care Data',
    display_name      = 'DHSC - Get Adult Social Care Data',
    department_name   = 'DHSC',
    agency_name       = 'DHSC'
WHERE client_id = 'LtOjB69ejHdOsQdT8rcBsL_D6BY';

--DBT - Payment Practices Reporting Service

INSERT INTO conformed_refactored.REF_RELYING_PARTIES_refactored(CLIENT_ID,CLIENT_NAME,DISPLAY_NAME,department_name,agency_name) 
SELECT 'NE3xe8nTQ_3ag9Wz5ToaSb8GfFA','Payment Practices Reporting Service','DBT - Payment Practices Reporting Service','DBT','BIST'
WHERE NOT EXISTS (
    SELECT 1
    FROM conformed_refactored.REF_RELYING_PARTIES_refactored
    WHERE client_id = 'NE3xe8nTQ_3ag9Wz5ToaSb8GfFA');


UPDATE conformed_refactored.dim_relying_party_refactored
SET relying_party_name = 'Payment Practices Reporting Service',
    display_name      = 'DBT - Payment Practices Reporting Service',
    department_name   = 'DBT',
    agency_name       = 'BIST'
WHERE client_id = 'NE3xe8nTQ_3ag9Wz5ToaSb8GfFA';