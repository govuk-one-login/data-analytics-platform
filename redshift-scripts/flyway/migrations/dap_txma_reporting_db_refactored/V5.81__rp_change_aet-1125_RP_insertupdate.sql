--WG - National Registration

INSERT INTO conformed_refactored.REF_RELYING_PARTIES_refactored(CLIENT_ID,CLIENT_NAME,DISPLAY_NAME,department_name,agency_name) 
SELECT 'MqQ-gO95NM-YC6ZTQTYbj0KGyBE','Local Transport Data Collection Forms'
       ,'DFT - Local Transport Data Collection Forms'
       ,'DFT'
       ,'DFT'
WHERE NOT EXISTS (
    SELECT 1
    FROM conformed_refactored.REF_RELYING_PARTIES_refactored
    WHERE client_id = 'MqQ-gO95NM-YC6ZTQTYbj0KGyBE');


UPDATE conformed_refactored.dim_relying_party_refactored
SET relying_party_name = 'Local Transport Data Collection Forms',
    display_name      = 'DFT - Local Transport Data Collection Forms',
    department_name   = 'DFT',
    agency_name       = 'DFT'
WHERE client_id = 'MqQ-gO95NM-YC6ZTQTYbj0KGyBE';