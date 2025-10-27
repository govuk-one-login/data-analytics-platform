--update to Short Term Lets Registration Scheme
update conformed_refactored."ref_relying_parties_refactored"
set client_id='M6lkFVRxW7ZV9W89QVLMLawidww' 
where client_id='vIJp3ifH_yAF_Z0DQbvuM80BcUw' ;


update conformed_refactored.dim_relying_party_refactored
set client_id='M6lkFVRxW7ZV9W89QVLMLawidww'
where client_id='vIJp3ifH_yAF_Z0DQbvuM80BcUw' ;


--DWP - Access to Work

INSERT INTO conformed_refactored.REF_RELYING_PARTIES_refactored(CLIENT_ID,CLIENT_NAME,DISPLAY_NAME,department_name,agency_name) 
SELECT 'zc7NmawFmzcouFBU86FgfC6ZrJc','Acces to Work','DWP - Access to Work','DWP','DWP'
WHERE NOT EXISTS (
    SELECT 1
    FROM conformed_refactored.REF_RELYING_PARTIES_refactored
    WHERE client_id = 'zc7NmawFmzcouFBU86FgfC6ZrJc'
);

UPDATE conformed_refactored.dim_relying_party_refactored
SET relying_party_name='Acces to Work'
    ,display_name='DWP - Access to Work'
    ,department_name='DWP'
    ,agency_name='DWP'
WHERE  client_id='zc7NmawFmzcouFBU86FgfC6ZrJc';