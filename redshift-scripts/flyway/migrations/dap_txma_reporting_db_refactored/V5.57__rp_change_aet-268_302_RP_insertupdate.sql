-- https://govukverify.atlassian.net/browse/AET-302

delete from "conformed_refactored"."ref_relying_parties_refactored"
where client_id in ('gKJ2YINNmukQJV3C00-vXvZiAwM') ;

delete from "conformed_refactored".dim_relying_party_refactored
where client_id in ('gKJ2YINNmukQJV3C00-vXvZiAwM') ;


--https://govukverify.atlassian.net/browse/AET-268

--DHSC - Personal Information Management

INSERT INTO conformed_refactored.REF_RELYING_PARTIES_refactored(CLIENT_ID,CLIENT_NAME,DISPLAY_NAME,department_name,agency_name) 
SELECT 'phyR5UdhgU2hhAZV7D-TJS_0Gns','Personal Information Management','DDHSC - Personal Information Management','DHSC','DHSC'
WHERE NOT EXISTS (
    SELECT 1
    FROM conformed_refactored.REF_RELYING_PARTIES_refactored
    WHERE client_id = 'phyR5UdhgU2hhAZV7D-TJS_0Gns'
);

UPDATE conformed_refactored.dim_relying_party_refactored
SET relying_party_name='Personal Information Management'
    ,display_name='DHSC - Personal Information Management'
    ,department_name='DHSC'
    ,agency_name='DHSC'
WHERE  client_id='phyR5UdhgU2hhAZV7D-TJS_0Gns';


--DESNZ - Heat Networks

INSERT INTO conformed_refactored.REF_RELYING_PARTIES_refactored(CLIENT_ID,CLIENT_NAME,DISPLAY_NAME,department_name,agency_name) 
SELECT '18wwAdm_lMyUAChqxnTZWyAksFQ','Heat Networks','DESNZ - Heat Networks','DESNZ','Ofgem'
WHERE NOT EXISTS (
    SELECT 1
    FROM conformed_refactored.REF_RELYING_PARTIES_refactored
    WHERE client_id = '18wwAdm_lMyUAChqxnTZWyAksFQ'
);

UPDATE conformed_refactored.dim_relying_party_refactored
SET relying_party_name='Heat Networks'
    ,display_name='DESNZ - Heat Networks'
    ,department_name='DESNZ'
    ,agency_name='Ofgem'
WHERE  client_id='18wwAdm_lMyUAChqxnTZWyAksFQ';


--DESNZ - Private Rented Sector Exemptions Register

INSERT INTO conformed_refactored.REF_RELYING_PARTIES_refactored(CLIENT_ID,CLIENT_NAME,DISPLAY_NAME,department_name,agency_name) 
SELECT 'REiRoFh0lDHTgZd7j-ecAjPrMw','Private Rented Sector Exemptions Register','DESNZ - Private Rented Sector Exemptions Register','DESNZ','DESNZ'
WHERE NOT EXISTS (
    SELECT 1
    FROM conformed_refactored.REF_RELYING_PARTIES_refactored
    WHERE client_id = 'REiRoFh0lDHTgZd7j-ecAjPrMw'
);

UPDATE conformed_refactored.dim_relying_party_refactored
SET relying_party_name='Private Rented Sector Exemptions Register'
    ,display_name='DESNZ - Private Rented Sector Exemptions Register'
    ,department_name='DESNZ'
    ,agency_name='DESNZ'
WHERE  client_id='REiRoFh0lDHTgZd7j-ecAjPrMw';
