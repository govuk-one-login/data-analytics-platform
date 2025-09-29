--DWP - Manage my State Pension

INSERT INTO conformed_refactored.REF_RELYING_PARTIES_refactored(CLIENT_ID,CLIENT_NAME,DISPLAY_NAME,department_name,agency_name) 
SELECT 'cugiITLIAK6BbpfAnjiAxMDcJ9o','Manage my State Pension','DWP - Manage my State Pension','DWP','DWP'
WHERE NOT EXISTS (
    SELECT 1
    FROM conformed_refactored.REF_RELYING_PARTIES_refactored
    WHERE client_id = 'cugiITLIAK6BbpfAnjiAxMDcJ9o'
);

UPDATE conformed_refactored.dim_relying_party_refactored
SET relying_party_name='Manage my State Pension'
    ,display_name='DWP - Manage my State Pension'
    ,department_name='DWP'
    ,agency_name='DWP'
WHERE  client_id='cugiITLIAK6BbpfAnjiAxMDcJ9o';


--WG - Farming Connect

INSERT INTO conformed_refactored.REF_RELYING_PARTIES_refactored(CLIENT_ID,CLIENT_NAME,DISPLAY_NAME,department_name,agency_name) 
SELECT 'Fu8Uu_QXznnDAm9yhkaYB6dtaT8','Farming Connect','WG - Farming Connect','WG','WG'
WHERE NOT EXISTS (
    SELECT 1
    FROM conformed_refactored.REF_RELYING_PARTIES_refactored
    WHERE client_id = 'Fu8Uu_QXznnDAm9yhkaYB6dtaT8'
);

UPDATE conformed_refactored.dim_relying_party_refactored
SET relying_party_name='Farming Connect'
    ,display_name='WG - Farming Connect'
    ,department_name='WG'
    ,agency_name='WG'
WHERE  client_id='Fu8Uu_QXznnDAm9yhkaYB6dtaT8';

--MOJ - Victims Pathfinder

INSERT INTO conformed_refactored.REF_RELYING_PARTIES_refactored(CLIENT_ID,CLIENT_NAME,DISPLAY_NAME,department_name,agency_name) 
SELECT 'PhP3oy13CW0RwBTL7UUGgvSiaCg','Victims Pathfinder','MOJ - Victims Pathfinder','MOJ','HMCTS'
WHERE NOT EXISTS (
    SELECT 1
    FROM conformed_refactored.REF_RELYING_PARTIES_refactored
    WHERE client_id = 'PhP3oy13CW0RwBTL7UUGgvSiaCg'
);

UPDATE conformed_refactored.dim_relying_party_refactored
SET relying_party_name='Victims Pathfinder'
    ,display_name='MOJ - Victims Pathfinder'
    ,department_name='MOJ'
    ,agency_name='HMCTS'
WHERE  client_id='PhP3oy13CW0RwBTL7UUGgvSiaCg';
