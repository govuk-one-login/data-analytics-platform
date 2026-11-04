--WG - DataMap Wales

INSERT INTO conformed_refactored.REF_RELYING_PARTIES_refactored
(CLIENT_ID,CLIENT_NAME,DISPLAY_NAME
,department_name,agency_name) 
SELECT 'FnlY2Qo9IcQY6Vc9IwXxwQfFVFI','DataMap Wales'
       ,'WG - DataMap Wales'
       ,'WG'
       ,'WG'
WHERE NOT EXISTS (
    SELECT 1
    FROM conformed_refactored.REF_RELYING_PARTIES_refactored
    WHERE client_id = 'FnlY2Qo9IcQY6Vc9IwXxwQfFVFI');


UPDATE conformed_refactored.dim_relying_party_refactored
SET relying_party_name = 'DataMap Wales',
    display_name      = 'WG - DataMap Wales',
    department_name   = 'WG',
    agency_name       = 'WG'
WHERE client_id = 'FnlY2Qo9IcQY6Vc9IwXxwQfFVFI';


--DEFRA - Rural Payments Service

INSERT INTO conformed_refactored.REF_RELYING_PARTIES_refactored
(CLIENT_ID,CLIENT_NAME,DISPLAY_NAME
,department_name,agency_name) 
SELECT 'IOdiJFEQEu_MawPmYL2tgoME8bA','Rural Payments Service'
       ,'DEFRA - Rural Payments Service'
       ,'DEFRA'
       ,'DEFRA'
WHERE NOT EXISTS (
    SELECT 1
    FROM conformed_refactored.REF_RELYING_PARTIES_refactored
    WHERE client_id = 'IOdiJFEQEu_MawPmYL2tgoME8bA');


UPDATE conformed_refactored.dim_relying_party_refactored
SET relying_party_name = 'Rural Payments Service',
    display_name      = 'DEFRA - Rural Payments Service',
    department_name   = 'DEFRA',
    agency_name       = 'DEFRA'
WHERE client_id = 'IOdiJFEQEu_MawPmYL2tgoME8bA';