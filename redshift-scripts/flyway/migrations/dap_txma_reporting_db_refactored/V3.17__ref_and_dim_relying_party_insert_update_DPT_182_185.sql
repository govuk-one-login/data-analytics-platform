INSERT INTO conformed_refactored.REF_RELYING_PARTIES_refactored(CLIENT_ID,CLIENT_NAME,DISPLAY_NAME,department_name,agency_name) 
    VALUES
('Hp9xO0Wda9EcI_2IO8OGeYJyrT0','Find and update company information','DBT - Find and update company information','DBT','CH');


UPDATE conformed_refactored.dim_relying_party_refactored
SET relying_party_name='Find and update company information'
    ,display_name='DBT - Find and update company information'
    ,department_name='DBT'
    ,agency_name='CH'
WHERE  client_id='Hp9xO0Wda9EcI_2IO8OGeYJyrT0';


INSERT INTO conformed_refactored.REF_RELYING_PARTIES_refactored(CLIENT_ID,CLIENT_NAME,DISPLAY_NAME,department_name,agency_name) 
    VALUES
('eywumu-XiJCz7RHyw4Zv8iTgsuc','Local Authority Flexible Eligibility','DESNZ - Local Authority Flexible Eligibility','DESNZ','Ofgem');


UPDATE conformed_refactored.dim_relying_party_refactored
SET relying_party_name='Local Authority Flexible Eligibility'
    ,display_name='DESNZ - Local Authority Flexible Eligibility'
    ,department_name='DESNZ'
    ,agency_name='Ofgem'
WHERE  client_id='eywumu-XiJCz7RHyw4Zv8iTgsuc';


INSERT INTO conformed_refactored.REF_RELYING_PARTIES_refactored(CLIENT_ID,CLIENT_NAME,DISPLAY_NAME,department_name,agency_name) 
    VALUES
('l6GFmD8ndn7afVcm6SqAHlM8IVM','Cancel a Lost or Stolen Passport','HO - Cancel a Lost or Stolen Passport','HO','HMPO');


UPDATE conformed_refactored.dim_relying_party_refactored
SET relying_party_name='Cancel a Lost or Stolen Passport'
    ,display_name='HO - Cancel a Lost or Stolen Passport'
    ,department_name='HO'
    ,agency_name='HMPO'
WHERE  client_id='l6GFmD8ndn7afVcm6SqAHlM8IVM';

INSERT INTO conformed_refactored.REF_RELYING_PARTIES_refactored(CLIENT_ID,CLIENT_NAME,DISPLAY_NAME,department_name,agency_name) 
    VALUES
('WH3OOFBYzTis2qf6lF0pcTzgx2M','Air pollution assessment archive','DESNZ - Air pollution assessment archive','DESNZ','JNCC');


UPDATE conformed_refactored.dim_relying_party_refactored
SET relying_party_name='Air pollution assessment archive'
    ,display_name='DESNZ - Air pollution assessment archive'
    ,department_name='DESNZ'
    ,agency_name='JNCC'
WHERE  client_id='WH3OOFBYzTis2qf6lF0pcTzgx2M';