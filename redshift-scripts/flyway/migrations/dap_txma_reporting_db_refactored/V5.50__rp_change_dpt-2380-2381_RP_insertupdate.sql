--update to Companies House Services
UPDATE conformed_refactored.dim_relying_party_refactored
SET relying_party_name='Companies House Services'
    ,display_name='DBT - Companies House Services'
WHERE  client_id='Hp9xO0Wda9EcI_2IO8OGeYJyrT0';

update conformed_refactored."ref_relying_parties_refactored"
set client_name='Companies House Services' ,
display_name='DBT - Companies House Services'
where client_id='Hp9xO0Wda9EcI_2IO8OGeYJyrT0' ;


--POLICE - Get Updates from the Police

INSERT INTO conformed_refactored.REF_RELYING_PARTIES_refactored(CLIENT_ID,CLIENT_NAME,DISPLAY_NAME,department_name,agency_name) 
SELECT 'lpbs49XzcfyPfDkMfLwrqxYpFlw','Get Updates from the Police','POLICE - Get Updates from the Police','POLICE','POLICE'
WHERE NOT EXISTS (
    SELECT 1
    FROM conformed_refactored.REF_RELYING_PARTIES_refactored
    WHERE client_id = 'lpbs49XzcfyPfDkMfLwrqxYpFlw'
);

UPDATE conformed_refactored.dim_relying_party_refactored
SET relying_party_name='Get Updates from the Police'
    ,display_name='POLICE - Get Updates from the Police'
    ,department_name='POLICE'
    ,agency_name='POLICE'
WHERE  client_id='lpbs49XzcfyPfDkMfLwrqxYpFlw';