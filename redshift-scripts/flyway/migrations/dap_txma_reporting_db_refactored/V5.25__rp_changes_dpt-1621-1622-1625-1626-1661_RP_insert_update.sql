
--GDS - GOV.UK One Login Mobile App

INSERT INTO conformed_refactored.REF_RELYING_PARTIES_refactored(CLIENT_ID,CLIENT_NAME,DISPLAY_NAME,department_name,agency_name) 
    VALUES
SELECT 'ibRd7MKF-uTB5tVtQQvc84lklrc', 'GOV.UK One Login Mobile App', 'GDS - GOV.UK One Login Mobile App','DSIT','GDS'
WHERE NOT EXISTS (
    SELECT 1
    FROM conformed_refactored.REF_RELYING_PARTIES_refactored
    WHERE event_name = 'ibRd7MKF-uTB5tVtQQvc84lklrc'
);

UPDATE conformed_refactored.dim_relying_party_refactored
SET relying_party_name='GOV.UK One Login Mobile App'
    ,display_name='GDS - GOV.UK One Login Mobile App'
    ,department_name='DSIT'
    ,agency_name='GDS'
WHERE  client_id='ibRd7MKF-uTB5tVtQQvc84lklrc';

--GDS - GOV.UK Mobile App

INSERT INTO conformed_refactored.REF_RELYING_PARTIES_refactored(CLIENT_ID,CLIENT_NAME,DISPLAY_NAME,department_name,agency_name) 
    VALUES
SELECT 'EznkQXGrWxi0cQMSACY15UzvG1Q', 'GOV.UK Mobile App', 'GDS - GOV.UK Mobile App','DSIT','GDS'
WHERE NOT EXISTS (
    SELECT 1
    FROM conformed_refactored.REF_RELYING_PARTIES_refactored
    WHERE event_name = 'EznkQXGrWxi0cQMSACY15UzvG1Q'
);

UPDATE conformed_refactored.dim_relying_party_refactored
SET relying_party_name='GOV.UK Mobile App'
    ,display_name='GDS - GOV.UK Mobile App'
    ,department_name='DSIT'
    ,agency_name='GDS'
WHERE  client_id='EznkQXGrWxi0cQMSACY15UzvG1Q';

--RP Onboarding -  Oracle Fusion - Enabling Shared Services to UKRI and UKSBS

INSERT INTO conformed_refactored.REF_RELYING_PARTIES_refactored(CLIENT_ID,CLIENT_NAME,DISPLAY_NAME,department_name,agency_name) 
    VALUES
SELECT '3BF8QDjd6aSvXWLCwVliAMiIuzQ', 'Enabling Shared Services to UKRI and UKSBS', 'Oracle Fusion - Enabling Shared Services to UKRI and UKSBS','UKSBS','Oracle Fusion'
WHERE NOT EXISTS (
    SELECT 1
    FROM conformed_refactored.REF_RELYING_PARTIES_refactored
    WHERE event_name = '3BF8QDjd6aSvXWLCwVliAMiIuzQ'
);

UPDATE conformed_refactored.dim_relying_party_refactored
SET relying_party_name='Enabling Shared Services to UKRI and UKSBS'
    ,display_name='Oracle Fusion - Enabling Shared Services to UKRI and UKSBS'
    ,department_name='UKSBS'
    ,agency_name='Oracle Fusion'
WHERE  client_id='3BF8QDjd6aSvXWLCwVliAMiIuzQ';

--RP Onboarding -  HO - Online Advanced Passenger Information System

INSERT INTO conformed_refactored.REF_RELYING_PARTIES_refactored(CLIENT_ID,CLIENT_NAME,DISPLAY_NAME,department_name,agency_name) 
    VALUES
SELECT 'B-T4i1nN4hvNEKuxNAzrjzc917o', 'Online Advanced Passenger Information System', 'HO - Online Advanced Passenger Information System','HO','HO'
WHERE NOT EXISTS (
    SELECT 1
    FROM conformed_refactored.REF_RELYING_PARTIES_refactored
    WHERE event_name = 'B-T4i1nN4hvNEKuxNAzrjzc917o'
);

UPDATE conformed_refactored.dim_relying_party_refactored
SET relying_party_name='Online Advanced Passenger Information System'
    ,display_name='HO - Online Advanced Passenger Information System'
    ,department_name='HO'
    ,agency_name='HO'
WHERE  client_id='B-T4i1nN4hvNEKuxNAzrjzc917o';

--RP Onboarding -  HO - Submit a Pleasure Craft Report

INSERT INTO conformed_refactored.REF_RELYING_PARTIES_refactored(CLIENT_ID,CLIENT_NAME,DISPLAY_NAME,department_name,agency_name) 
    VALUES
SELECT 'pr5XqmAxS1sVj5e7hVhL-P-hJ9Q', 'Submit a Pleasure Craft Report', 'HO - Submit a Pleasure Craft Report','HO','HO'
WHERE NOT EXISTS (
    SELECT 1
    FROM conformed_refactored.REF_RELYING_PARTIES_refactored
    WHERE event_name = 'pr5XqmAxS1sVj5e7hVhL-P-hJ9Q'
);

UPDATE conformed_refactored.dim_relying_party_refactored
SET relying_party_name='Submit a Pleasure Craft Report'
    ,display_name='HO - Submit a Pleasure Craft Report'
    ,department_name='HO'
    ,agency_name='HO'
WHERE  client_id='pr5XqmAxS1sVj5e7hVhL-P-hJ9Q';

--RP Onboarding -  DFT - Connectivity Tool

INSERT INTO conformed_refactored.REF_RELYING_PARTIES_refactored(CLIENT_ID,CLIENT_NAME,DISPLAY_NAME,department_name,agency_name) 
    VALUES
SELECT '-ntxNyJ7nMXdWL0VcTF_pTkv3z4', 'Connectivity Tool', 'DFT - Connectivity Tool','DFT','DFT'
WHERE NOT EXISTS (
    SELECT 1
    FROM conformed_refactored.REF_RELYING_PARTIES_refactored
    WHERE event_name = '-ntxNyJ7nMXdWL0VcTF_pTkv3z4'
);

UPDATE conformed_refactored.dim_relying_party_refactored
SET relying_party_name='Connectivity Tool'
    ,display_name='DFT - Connectivity Tool'
    ,department_name='DFT'
    ,agency_name='DFT'
WHERE  client_id='-ntxNyJ7nMXdWL0VcTF_pTkv3z4';