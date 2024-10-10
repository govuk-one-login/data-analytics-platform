INSERT INTO conformed_refactored.REF_RELYING_PARTIES_refactored(CLIENT_ID,CLIENT_NAME,DISPLAY_NAME,department_name,agency_name) 
    VALUES
('u6cETcTbDeT5PZaRRvUskHQeZq8','Dangerous Dog Index','DEFRA - Dangerous Dog Index','DEFRA','DEFRA');


UPDATE conformed_refactored.dim_relying_party_refactored
SET relying_party_name='Dangerous Dog Index'
    ,display_name='DEFRA - Dangerous Dog Index'
    ,department_name='DEFRA'
    ,agency_name='DEFRA'
WHERE  client_id='u6cETcTbDeT5PZaRRvUskHQeZq8';