--DHSC - Adult Social Care

INSERT INTO conformed_refactored.REF_RELYING_PARTIES_refactored(CLIENT_ID,CLIENT_NAME,DISPLAY_NAME,department_name,agency_name) 
SELECT 'OAC1Tcd2ksqd2lPPhFR4Eno91Kw','Adult Social Care','DHSC - Adult Social Care','DHSC','DHSC'
WHERE NOT EXISTS (
    SELECT 1
    FROM conformed_refactored.REF_RELYING_PARTIES_refactored
    WHERE client_id = 'OAC1Tcd2ksqd2lPPhFR4Eno91Kw'
);

UPDATE conformed_refactored.dim_relying_party_refactored
SET relying_party_name='Adult Social Care'
    ,display_name='DHSC - Adult Social Care'
    ,department_name='DHSC'
    ,agency_name='DHSC'
WHERE  client_id='OAC1Tcd2ksqd2lPPhFR4Eno91Kw';


--DWP - Apply for Personal Independence Payment

INSERT INTO conformed_refactored.REF_RELYING_PARTIES_refactored(CLIENT_ID,CLIENT_NAME,DISPLAY_NAME,department_name,agency_name) 
SELECT 'A03QrGd-By1RbjBRez8U88xgx3w','Apply for Personal Independence Payment','DWP - Apply for Personal Independence Payment','DWP','DWP'
WHERE NOT EXISTS (
    SELECT 1
    FROM conformed_refactored.REF_RELYING_PARTIES_refactored
    WHERE client_id = 'A03QrGd-By1RbjBRez8U88xgx3w'
);

UPDATE conformed_refactored.dim_relying_party_refactored
SET relying_party_name='Apply for Personal Independence Payment'
    ,display_name='DWP - Apply for Personal Independence Payment'
    ,department_name='DWP'
    ,agency_name='DWP'
WHERE  client_id='A03QrGd-By1RbjBRez8U88xgx3w';
