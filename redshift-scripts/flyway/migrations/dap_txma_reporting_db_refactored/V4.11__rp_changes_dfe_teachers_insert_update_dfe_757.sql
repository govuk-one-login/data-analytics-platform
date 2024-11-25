
INSERT INTO conformed_refactored.REF_RELYING_PARTIES_refactored(CLIENT_ID,CLIENT_NAME,DISPLAY_NAME,department_name,agency_name) 
    VALUES
('GQzNgSkj3QpmHlPO1kIfbMW1PAw','Apply for Qualified Teacher Status','DFE - Apply for Qualified Teacher Status','DFE','DFE');


UPDATE conformed_refactored.dim_relying_party_refactored
SET relying_party_name='Apply for Qualified Teacher Status'
    ,display_name='DFE - Apply for Qualified Teacher Status'
    ,department_name='DFE'
    ,agency_name='DFE'
WHERE  client_id='GQzNgSkj3QpmHlPO1kIfbMW1PAw';