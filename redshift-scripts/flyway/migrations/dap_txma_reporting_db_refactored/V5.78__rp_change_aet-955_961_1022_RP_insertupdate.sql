--DBT - British Industrial Competitiveness Scheme

INSERT INTO conformed_refactored.REF_RELYING_PARTIES_refactored(CLIENT_ID,CLIENT_NAME,DISPLAY_NAME,department_name,agency_name) 
SELECT 'M7vqqdwKEfVAwnCpidhUpI4NuXo','British Industrial Competitiveness Scheme',
       'DBT - British Industrial Competitiveness Scheme','DBT','DBT'
WHERE NOT EXISTS (
    SELECT 1
    FROM conformed_refactored.REF_RELYING_PARTIES_refactored
    WHERE client_id = 'M7vqqdwKEfVAwnCpidhUpI4NuXo');


UPDATE conformed_refactored.dim_relying_party_refactored
SET relying_party_name = 'British Industrial Competitiveness Scheme',
    display_name      = 'DBT - British Industrial Competitiveness Scheme',
    department_name   = 'DBT',
    agency_name       = 'DBT'
WHERE client_id = 'M7vqqdwKEfVAwnCpidhUpI4NuXo';


--Ofqual - Renew or Reapply as an Ofqual Subject Matter Specialist

INSERT INTO conformed_refactored.REF_RELYING_PARTIES_refactored(CLIENT_ID,CLIENT_NAME,DISPLAY_NAME,department_name,agency_name) 
SELECT 'P0kf8mj3m-CXcpvgyvp__gTCyNc','Renew or Reapply as an Ofqual Subject Matter Specialist'
       ,'Ofqual - Renew or Reapply as an Ofqual Subject Matter Specialist','DFE','Ofqual'
WHERE NOT EXISTS (
    SELECT 1
    FROM conformed_refactored.REF_RELYING_PARTIES_refactored
    WHERE client_id = 'P0kf8mj3m-CXcpvgyvp__gTCyNc');


UPDATE conformed_refactored.dim_relying_party_refactored
SET relying_party_name = 'Renew or Reapply as an Ofqual Subject Matter Specialist',
    display_name      = 'Ofqual - Renew or Reapply as an Ofqual Subject Matter Specialist',
    department_name   = 'DFE',
    agency_name       = 'Ofqual'
WHERE client_id = 'P0kf8mj3m-CXcpvgyvp__gTCyNc';


--MOD - Defence Gateway

INSERT INTO conformed_refactored.REF_RELYING_PARTIES_refactored(CLIENT_ID,CLIENT_NAME,DISPLAY_NAME,department_name,agency_name) 
SELECT 'URKBwRhfWnJCoVv-MbCp9BDtZsQ','Defence Gateway'
       ,'MOD - Defence Gateway','MOD','MOD'
WHERE NOT EXISTS (
    SELECT 1
    FROM conformed_refactored.REF_RELYING_PARTIES_refactored
    WHERE client_id = 'URKBwRhfWnJCoVv-MbCp9BDtZsQ');


UPDATE conformed_refactored.dim_relying_party_refactored
SET relying_party_name = 'Defence Gateway',
    display_name      = 'MOD - Defence Gateway',
    department_name   = 'MOD',
    agency_name       = 'MOD'
WHERE client_id = 'URKBwRhfWnJCoVv-MbCp9BDtZsQ';