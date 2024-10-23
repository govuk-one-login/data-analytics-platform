INSERT INTO conformed_refactored.REF_RELYING_PARTIES_refactored(CLIENT_ID,CLIENT_NAME,DISPLAY_NAME,department_name,agency_name) 
    VALUES
('kvGpTatgWm3YqXHbG41eOdDf91k','Repay and manage benefit money you owe','DWP - Repay and manage benefit money you owe','DWP','DWP');


UPDATE conformed_refactored.dim_relying_party_refactored
SET relying_party_name='Repay and manage benefit money you owe'
    ,display_name='DWP - Repay and manage benefit money you owe'
    ,department_name='DWP'
    ,agency_name='DWP'
WHERE  client_id='kvGpTatgWm3YqXHbG41eOdDf91k';



INSERT INTO conformed_refactored.REF_RELYING_PARTIES_refactored(CLIENT_ID,CLIENT_NAME,DISPLAY_NAME,department_name,agency_name) 
    VALUES
('L8SSq5Iz8DstkBgno0Hx5aujelE','Find a tender','CO - Find a tender','CO','CO');


UPDATE conformed_refactored.dim_relying_party_refactored
SET relying_party_name='Find a tender'
    ,display_name='CO - Find a tender'
    ,department_name='CO'
    ,agency_name='CO'
WHERE  client_id='L8SSq5Iz8DstkBgno0Hx5aujelE';