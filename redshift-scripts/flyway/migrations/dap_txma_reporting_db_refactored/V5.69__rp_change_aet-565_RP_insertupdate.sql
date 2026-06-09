--DFE - Register a National Professional Qualification

INSERT INTO conformed_refactored.REF_RELYING_PARTIES_refactored(CLIENT_ID,CLIENT_NAME,DISPLAY_NAME,department_name,agency_name) 
SELECT 'DD1qQMnQ8UThae3vXwZVo59DbYM','Register for a National Professional Qualification','DFE - Register a National Professional Qualification','DFE','DFE'
WHERE NOT EXISTS (
    SELECT 1
    FROM conformed_refactored.REF_RELYING_PARTIES_refactored
    WHERE client_id = 'DD1qQMnQ8UThae3vXwZVo59DbYM');


UPDATE conformed_refactored.dim_relying_party_refactored
SET relying_party_name = 'Register for a National Professional Qualification',
    display_name      = 'DFE - Register for a National Professional Qualification',
    department_name   = 'DFE',
    agency_name       = 'DFE'
WHERE client_id = 'DD1qQMnQ8UThae3vXwZVo59DbYM';