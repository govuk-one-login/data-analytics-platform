--DWP - Find your Pension

INSERT INTO conformed_refactored.REF_RELYING_PARTIES_refactored(CLIENT_ID,CLIENT_NAME,DISPLAY_NAME,department_name,agency_name) 
SELECT 'CKM7lHoxwJdjPzgUAxp-Rdbi_04', 'Find your Pension', 'DWP - Find your Pension','DWP','MaPS'
WHERE NOT EXISTS (
    SELECT 1
    FROM conformed_refactored.REF_RELYING_PARTIES_refactored
    WHERE client_id = 'CKM7lHoxwJdjPzgUAxp-Rdbi_04'
);

UPDATE conformed_refactored.dim_relying_party_refactored
SET relying_party_name='Find your Pension'
    ,display_name='DWP - Find your Pension'
    ,department_name='DWP'
    ,agency_name='MaPS'
WHERE  client_id='CKM7lHoxwJdjPzgUAxp-Rdbi_04';



--GIO Platform

INSERT INTO conformed_refactored.REF_RELYING_PARTIES_refactored(CLIENT_ID,CLIENT_NAME,DISPLAY_NAME,department_name,agency_name) 
SELECT 'GUFKZJqzRyi1aQVmaZuuLl5lBR4', 'GIO Platform', 'DEFRA - GIO Platform','DEFRA','DEFRA'
WHERE NOT EXISTS (
    SELECT 1
    FROM conformed_refactored.REF_RELYING_PARTIES_refactored
    WHERE client_id = 'GUFKZJqzRyi1aQVmaZuuLl5lBR4'
);

UPDATE conformed_refactored.dim_relying_party_refactored
SET relying_party_name='GIO Platform'
    ,display_name='DEFRA - GIO Platform'
    ,department_name='DEFRA'
    ,agency_name='DEFRA'
WHERE  client_id='GUFKZJqzRyi1aQVmaZuuLl5lBR4';


-- Submit a General Aviation Report

UPDATE conformed_refactored.dim_relying_party_refactored
SET relying_party_name='Submit a General Aviation Report'
    ,display_name='HO - Submit a General Aviation Report'
WHERE  client_id='pr5XqmAxS1sVj5e7hVhL-P-hJ9Q';

UPDATE conformed_refactored.ref_relying_parties_refactored
SET client_name='Submit a General Aviation Report'
    ,display_name='HO - Submit a General Aviation Report'
WHERE  client_id='pr5XqmAxS1sVj5e7hVhL-P-hJ9Q';