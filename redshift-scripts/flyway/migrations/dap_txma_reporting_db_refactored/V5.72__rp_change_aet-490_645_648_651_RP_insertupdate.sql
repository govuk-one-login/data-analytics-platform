--MOJ - People on Probation

INSERT INTO conformed_refactored.REF_RELYING_PARTIES_refactored(CLIENT_ID,CLIENT_NAME,DISPLAY_NAME,department_name,agency_name) 
SELECT 'z9MikRghbhHBwzXYH7i7z8RL0Pk','People on Probation','MOJ - People on Probation','MOJ','HMPPS'
WHERE NOT EXISTS (
    SELECT 1
    FROM conformed_refactored.REF_RELYING_PARTIES_refactored
    WHERE client_id = 'z9MikRghbhHBwzXYH7i7z8RL0Pk');


UPDATE conformed_refactored.dim_relying_party_refactored
SET relying_party_name = 'People on Probation',
    display_name      = 'MOJ - People on Probation',
    department_name   = 'MOJ',
    agency_name       = 'HMPPS'
WHERE client_id = 'z9MikRghbhHBwzXYH7i7z8RL0Pk';


--DFE - Register for a National Professional Development Course

INSERT INTO conformed_refactored.REF_RELYING_PARTIES_refactored(CLIENT_ID,CLIENT_NAME,DISPLAY_NAME,department_name,agency_name) 
SELECT '3XJkCpoGvLi5t-RUBBAnvMA_Zhc','Register for a National Professional Development Course','DFE - Register for a National Professional Development Course','DFE','DFE'
WHERE NOT EXISTS (
    SELECT 1
    FROM conformed_refactored.REF_RELYING_PARTIES_refactored
    WHERE client_id = '3XJkCpoGvLi5t-RUBBAnvMA_Zhc');


UPDATE conformed_refactored.dim_relying_party_refactored
SET relying_party_name = 'Register for a National Professional Development Course',
    display_name      = 'DFE - Register for a National Professional Development Course',
    department_name   = 'DFE',
    agency_name       = 'DFE'
WHERE client_id = '3XJkCpoGvLi5t-RUBBAnvMA_Zhc';


--DHSC - Recruit Registry Volunteers

INSERT INTO conformed_refactored.REF_RELYING_PARTIES_refactored(CLIENT_ID,CLIENT_NAME,DISPLAY_NAME,department_name,agency_name) 
SELECT '0NZ61WqumNsH8cuaIZ8MxJoyjkQ','Recruit Registry Volunteers','DHSC - Recruit Registry Volunteers','DHSC','NIHR'
WHERE NOT EXISTS (
    SELECT 1
    FROM conformed_refactored.REF_RELYING_PARTIES_refactored
    WHERE client_id = '0NZ61WqumNsH8cuaIZ8MxJoyjkQ');


UPDATE conformed_refactored.dim_relying_party_refactored
SET relying_party_name = 'Recruit Registry Volunteers',
    display_name      = 'DHSC - Recruit Registry Volunteers',
    department_name   = 'DHSC',
    agency_name       = 'NIHR'
WHERE client_id = '0NZ61WqumNsH8cuaIZ8MxJoyjkQ';

--WG - Electronic Register for Common Land in Wales

INSERT INTO conformed_refactored.REF_RELYING_PARTIES_refactored(CLIENT_ID,CLIENT_NAME,DISPLAY_NAME,department_name,agency_name) 
SELECT '3LlqQpWN3XySoIJmkw1OyBdeIWM','Electronic Register for Common Land in Wales','WG - Electronic Register for Common Land in Wales','WG','WG'
WHERE NOT EXISTS (
    SELECT 1
    FROM conformed_refactored.REF_RELYING_PARTIES_refactored
    WHERE client_id = '3LlqQpWN3XySoIJmkw1OyBdeIWM');


UPDATE conformed_refactored.dim_relying_party_refactored
SET relying_party_name = 'Electronic Register for Common Land in Wales',
    display_name      = 'WG - Electronic Register for Common Land in Wales',
    department_name   = 'WG',
    agency_name       = 'WG'
WHERE client_id = '3LlqQpWN3XySoIJmkw1OyBdeIWM';