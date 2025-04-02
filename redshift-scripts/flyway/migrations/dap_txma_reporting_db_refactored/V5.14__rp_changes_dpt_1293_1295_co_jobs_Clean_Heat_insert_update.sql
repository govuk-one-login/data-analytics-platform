--Manage Clean Heat Market Mechanism

INSERT INTO conformed_refactored.REF_RELYING_PARTIES_refactored(CLIENT_ID,CLIENT_NAME,DISPLAY_NAME,department_name,agency_name) 
    VALUES
('ylIM6FsPzeV5fN09v4cl2aDbpnE','Manage Clean Heat Market Mechanism','DESNZ - Manage Clean Heat Market Mechanism','DESNZ','DESNZ');


UPDATE conformed_refactored.dim_relying_party_refactored
SET relying_party_name='Manage Clean Heat Market Mechanism'
    ,display_name='DESNZ - Manage Clean Heat Market Mechanism'
    ,department_name='DESNZ'
    ,agency_name='DESNZ'
WHERE  client_id='ylIM6FsPzeV5fN09v4cl2aDbpnE';


--Civil Service Jobs 

INSERT INTO conformed_refactored.REF_RELYING_PARTIES_refactored(CLIENT_ID,CLIENT_NAME,DISPLAY_NAME,department_name,agency_name) 
    VALUES
('JbFTEj93ueyJAvYy75HzIc1790I','Civil Service Jobs ','CO - Civil Service Jobs ','CO','CO');


UPDATE conformed_refactored.dim_relying_party_refactored
SET relying_party_name='Civil Service Jobs '
    ,display_name='CO - Civil Service Jobs '
    ,department_name='CO'
    ,agency_name='CO'
WHERE  client_id='JbFTEj93ueyJAvYy75HzIc1790I';
