--MHCLG - Data Driven Insights Platform

INSERT INTO conformed_refactored.REF_RELYING_PARTIES_refactored(CLIENT_ID,CLIENT_NAME,DISPLAY_NAME,department_name,agency_name) 
SELECT 'GIvJ8cn4v34SY4hdX-u09Tho2qs','Data Driven Insights Platform','MHCLG - Data Driven Insights Platform','MHCLG','MHCLG'
WHERE NOT EXISTS (
    SELECT 1
    FROM conformed_refactored.REF_RELYING_PARTIES_refactored
    WHERE client_id = 'c2DL-h6T8YQcLDCTj1voXYipiZ8'
);

UPDATE conformed_refactored.dim_relying_party_refactored
SET relying_party_name='Data Driven Insights Platform'
    ,display_name='MHCLG - Data Driven Insights Platform'
    ,department_name='MHCLG'
    ,agency_name='MHCLG'
WHERE  client_id='GIvJ8cn4v34SY4hdX-u09Tho2qs';