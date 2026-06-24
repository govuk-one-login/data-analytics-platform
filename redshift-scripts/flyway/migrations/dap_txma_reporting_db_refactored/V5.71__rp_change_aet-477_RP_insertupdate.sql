--GDS - GOV.UK Forms

INSERT INTO conformed_refactored.REF_RELYING_PARTIES_refactored(CLIENT_ID,CLIENT_NAME,DISPLAY_NAME,department_name,agency_name) 
SELECT 'LOpf_W36LvkkwBRf8EFHAoxf_Jw','GOV.UK Forms','GDS - GOV.UK Forms','GDS','GDS'
WHERE NOT EXISTS (
    SELECT 1
    FROM conformed_refactored.REF_RELYING_PARTIES_refactored
    WHERE client_id = 'LOpf_W36LvkkwBRf8EFHAoxf_Jw');


UPDATE conformed_refactored.dim_relying_party_refactored
SET relying_party_name = 'GOV.UK Forms',
    display_name      = 'GDS - GOV.UK Forms',
    department_name   = 'GDS',
    agency_name       = 'GDS'
WHERE client_id = 'LOpf_W36LvkkwBRf8EFHAoxf_Jw';