INSERT INTO conformed_refactored.REF_RELYING_PARTIES_refactored(CLIENT_ID,CLIENT_NAME,DISPLAY_NAME,department_name,agency_name) 
    VALUES
('XbPzF-ccO0utCxlifxSyA4Ng0API2XTCQQ',	'Visit someone in prison','MOJ - Visit someone in prison','MOJ','MOJ');

UPDATE conformed_refactored.dim_relying_party_refactored
SET relying_party_name='Visit someone in prison'
    ,display_name='MOJ - Visit someone in prison'
    ,department_name='MOJ'
    ,agency_name='MOJ'
WHERE  client_id='XbPzF-ccO0utCxlifxSyA4Ng0API2XTCQQ';