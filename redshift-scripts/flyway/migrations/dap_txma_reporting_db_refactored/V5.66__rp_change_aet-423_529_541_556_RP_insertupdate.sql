--DWP - Maternity Allowance

INSERT INTO conformed_refactored.REF_RELYING_PARTIES_refactored(CLIENT_ID,CLIENT_NAME,DISPLAY_NAME,department_name,agency_name) 
SELECT 'fa96gl_XKILTF5IyuzmVUPnSa20','Maternity Allowance','DWP - Maternity Allowance','DWP','DWP'
WHERE NOT EXISTS (
    SELECT 1
    FROM conformed_refactored.REF_RELYING_PARTIES_refactored
    WHERE client_id = 'fa96gl_XKILTF5IyuzmVUPnSa20');


UPDATE conformed_refactored.dim_relying_party_refactored
SET relying_party_name = 'Maternity Allowance',
    display_name      = 'DWP - Maternity Allowance',
    department_name   = 'DWP',
    agency_name       = 'DWP'
WHERE client_id = 'fa96gl_XKILTF5IyuzmVUPnSa20';


--HO - Manage Asylum Claim

INSERT INTO conformed_refactored.REF_RELYING_PARTIES_refactored(CLIENT_ID,CLIENT_NAME,DISPLAY_NAME,department_name,agency_name) 
SELECT 'SieRjp5RnuEZdhAVxUY3aXGDPkE','Manage Asylum Claim','HO - Manage Asylum Claim','HO','HO'
WHERE NOT EXISTS (
    SELECT 1
    FROM conformed_refactored.REF_RELYING_PARTIES_refactored
    WHERE client_id = 'SieRjp5RnuEZdhAVxUY3aXGDPkE');


UPDATE conformed_refactored.dim_relying_party_refactored
SET relying_party_name = 'Manage Asylum Claim',
    display_name      = 'HO - Manage Asylum Claim',
    department_name   = 'HO',
    agency_name       = 'HO'
WHERE client_id = 'SieRjp5RnuEZdhAVxUY3aXGDPkE';


--DFE - Early Years Teacher Recognition Payment

INSERT INTO conformed_refactored.REF_RELYING_PARTIES_refactored(CLIENT_ID,CLIENT_NAME,DISPLAY_NAME,department_name,agency_name) 
SELECT '2dwMg700-_FXDXmUK7qUzQDj_5Q','Early Years Teacher Recognition Payment','DFE - Early Years Teacher Recognition Payment','DFE','DFE'
WHERE NOT EXISTS (
    SELECT 1
    FROM conformed_refactored.REF_RELYING_PARTIES_refactored
    WHERE client_id = '2dwMg700-_FXDXmUK7qUzQDj_5Q');


UPDATE conformed_refactored.dim_relying_party_refactored
SET relying_party_name = 'Early Years Teacher Recognition Payment',
    display_name      = 'DFE - Early Years Teacher Recognition Payment',
    department_name   = 'DFE',
    agency_name       = 'DFE'
WHERE client_id = '2dwMg700-_FXDXmUK7qUzQDj_5Q';


--SLC - Manage your Student Finance

INSERT INTO conformed_refactored.REF_RELYING_PARTIES_refactored(CLIENT_ID,CLIENT_NAME,DISPLAY_NAME,department_name,agency_name) 
SELECT 'F0hQSHLX2eNdfXRTM3yGPfDpUZw','Manage your Student Finance','SLC - Manage your Student Finance','DFE','SLC'
WHERE NOT EXISTS (
    SELECT 1
    FROM conformed_refactored.REF_RELYING_PARTIES_refactored
    WHERE client_id = 'F0hQSHLX2eNdfXRTM3yGPfDpUZw');


UPDATE conformed_refactored.dim_relying_party_refactored
SET relying_party_name = 'Manage your Student Finance',
    display_name      = 'SLC - Manage your Student Finance',
    department_name   = 'DFE',
    agency_name       = 'SLC'
WHERE client_id = 'F0hQSHLX2eNdfXRTM3yGPfDpUZw';