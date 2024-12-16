
INSERT INTO conformed_refactored.REF_RELYING_PARTIES_refactored(CLIENT_ID,CLIENT_NAME,DISPLAY_NAME,department_name,agency_name) 
    VALUES
('dPIP320ek5A50_12a00U2sEoM0k','Apply for a Licence to Provide Sanctioned Trade Services','DBT - Apply for a Licence to Provide Sanctioned Trade Services','DBT','DBT');


UPDATE conformed_refactored.dim_relying_party_refactored
SET relying_party_name='Apply for a Licence to Provide Sanctioned Trade Services'
    ,display_name='DBT - Apply for a Licence to Provide Sanctioned Trade Services'
    ,department_name='DBT'
    ,agency_name='DBT'
WHERE  client_id='dPIP320ek5A50_12a00U2sEoM0k';