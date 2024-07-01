INSERT INTO conformed_refactored.REF_RELYING_PARTIES_refactored(CLIENT_ID,CLIENT_NAME,DISPLAY_NAME,department_name,agency_name) 
    VALUES
('S1hl5G31dSsMYqPaOuiRVOLhBX0',	'ATE Update your Capital Schemes','DFT - ATE Update your Capital Schemes','DFT','DFT');


UPDATE conformed_refactored.dim_relying_party_refactored
SET relying_party_name='ATE Update your Capital Schemes'
    ,display_name='DFT - ATE Update your Capital Schemes'
    ,department_name='DFT'
    ,agency_name='DFT'
WHERE  client_id='S1hl5G31dSsMYqPaOuiRVOLhBX0';