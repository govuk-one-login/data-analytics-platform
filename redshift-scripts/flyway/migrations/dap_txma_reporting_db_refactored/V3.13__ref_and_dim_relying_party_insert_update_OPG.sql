INSERT INTO conformed_refactored.REF_RELYING_PARTIES_refactored(CLIENT_ID,CLIENT_NAME,DISPLAY_NAME,department_name,agency_name) 
    VALUES
('DduaLZl49t9hHADHyzJBmEwvbsw','Use a LPA','MOJ - OPG Use a LPA','MOJ','OPG');


UPDATE conformed_refactored.dim_relying_party_refactored
SET relying_party_name='Use a LPA'
    ,display_name='MOJ - OPG Use a LPA'
    ,department_name='MOJ'
    ,agency_name='OPG'
WHERE  client_id='DduaLZl49t9hHADHyzJBmEwvbsw';