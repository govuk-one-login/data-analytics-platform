--Foreign Influence Registration Scheme

INSERT INTO conformed_refactored.REF_RELYING_PARTIES_refactored(CLIENT_ID,CLIENT_NAME,DISPLAY_NAME,department_name,agency_name) 
    VALUES
('sXr5F6w5QytPPJN-Dtsgbl6hegQ','Foreign Influence Registration Scheme','HO - Foreign Influence Registration Scheme','HO','HSG');


UPDATE conformed_refactored.dim_relying_party_refactored
SET relying_party_name='Foreign Influence Registration Scheme'
    ,display_name='HO - Foreign Influence Registration Scheme'
    ,department_name='HO'
    ,agency_name='HSG'
WHERE  client_id='sXr5F6w5QytPPJN-Dtsgbl6hegQ';