UPDATE conformed_refactored.REF_RELYING_PARTIES_refactored
SET  display_name='MaPS - Find your Pension'
WHERE  client_id='CKM7lHoxwJdjPzgUAxp-Rdbi_04';


UPDATE conformed_refactored.dim_relying_party_refactored
SET  display_name='MaPS - Find your Pension'
WHERE  client_id='CKM7lHoxwJdjPzgUAxp-Rdbi_04';

--MOJ - Pension Relief

INSERT INTO conformed_refactored.REF_RELYING_PARTIES_refactored(CLIENT_ID,CLIENT_NAME,DISPLAY_NAME,department_name,agency_name) 
SELECT 'c2DL-h6T8YQcLDCTj1voXYipiZ8','Pension Relief','MOJ - Pension Relief','MOJ','MOJ'
WHERE NOT EXISTS (
    SELECT 1
    FROM conformed_refactored.REF_RELYING_PARTIES_refactored
    WHERE client_id = 'c2DL-h6T8YQcLDCTj1voXYipiZ8'
);

UPDATE conformed_refactored.dim_relying_party_refactored
SET relying_party_name='Pension Relief'
    ,display_name='MOJ - Pension Relief'
    ,department_name='MOJ'
    ,agency_name='MOJ'
WHERE  client_id='c2DL-h6T8YQcLDCTj1voXYipiZ8';
