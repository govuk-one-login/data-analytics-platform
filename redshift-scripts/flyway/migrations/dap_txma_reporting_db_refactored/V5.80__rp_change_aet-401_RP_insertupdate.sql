-WG - National Registration

INSERT INTO conformed_refactored.REF_RELYING_PARTIES_refactored(CLIENT_ID,CLIENT_NAME,DISPLAY_NAME,department_name,agency_name) 
SELECT '2mhgqmHQtJn8pVnS74V0wY7Mlo0','National Registration','WG - National Registration','WG','WG'
WHERE NOT EXISTS (
    SELECT 1
    FROM conformed_refactored.REF_RELYING_PARTIES_refactored
    WHERE client_id = '2mhgqmHQtJn8pVnS74V0wY7Mlo0');


UPDATE conformed_refactored.dim_relying_party_refactoredgit comm
SET relying_party_name = 'National Registration',
    display_name      = 'WG - National Registration',
    department_name   = 'WG',
    agency_name       = 'WG'
WHERE client_id = '2mhgqmHQtJn8pVnS74V0wY7Mlo0';
