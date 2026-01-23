--DESNZ - Ofgem Financial Resilience

INSERT INTO conformed_refactored.REF_RELYING_PARTIES_refactored(CLIENT_ID,CLIENT_NAME,DISPLAY_NAME,department_name,agency_name) 
SELECT 'fPfaL9pGNBYpxdv3vlON2BjfcII','Ofgem Financial Resilience','DESNZ - Ofgem Financial Resilience','DESNZ','Ofgem'
WHERE NOT EXISTS (
    SELECT 1
    FROM conformed_refactored.REF_RELYING_PARTIES_refactored
    WHERE client_id = 'fPfaL9pGNBYpxdv3vlON2BjfcII'
);

UPDATE conformed_refactored.dim_relying_party_refactored
SET relying_party_name='Ofgem Financial Resilience'
    ,display_name='DESNZ - Ofgem Financial Resilience'
    ,department_name='DESNZ'
    ,agency_name='Ofgem'
WHERE  client_id='fPfaL9pGNBYpxdv3vlON2BjfcII';


--MOD - Defence Developer Services

INSERT INTO conformed_refactored.REF_RELYING_PARTIES_refactored(CLIENT_ID,CLIENT_NAME,DISPLAY_NAME,department_name,agency_name) 
SELECT 'DEJ5AQSmiNGg36gHCR3o4uAYxhA','Defence Developer Services','MOD - Defence Developer Services','MOD','MOD'
WHERE NOT EXISTS (
    SELECT 1
    FROM conformed_refactored.REF_RELYING_PARTIES_refactored
    WHERE client_id = 'DEJ5AQSmiNGg36gHCR3o4uAYxhA'
);

UPDATE conformed_refactored.dim_relying_party_refactored
SET relying_party_name='Defence Developer Services'
    ,display_name='MOD - Defence Developer Services'
    ,department_name='MOD'
    ,agency_name='MOD'
WHERE  client_id='DEJ5AQSmiNGg36gHCR3o4uAYxhA';


--DFE - Access Your Teaching Qualifications

INSERT INTO conformed_refactored.REF_RELYING_PARTIES_refactored(CLIENT_ID,CLIENT_NAME,DISPLAY_NAME,department_name,agency_name) 
SELECT 'q5hgiE0V2meH7KqN04cdBl6PWm8','Access Your Teaching Qualifications','DFE - Access Your Teaching Qualifications','DFE','DFE'
WHERE NOT EXISTS (
    SELECT 1
    FROM conformed_refactored.REF_RELYING_PARTIES_refactored
    WHERE client_id = 'q5hgiE0V2meH7KqN04cdBl6PWm8'
);

UPDATE conformed_refactored.dim_relying_party_refactored
SET relying_party_name='Access Your Teaching Qualifications'
    ,display_name='DFE - Access Your Teaching Qualifications'
    ,department_name='DFE'
    ,agency_name='DFE'
WHERE  client_id='q5hgiE0V2meH7KqN04cdBl6PWm8';
