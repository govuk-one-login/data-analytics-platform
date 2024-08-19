INSERT INTO conformed_refactored.REF_RELYING_PARTIES_refactored(CLIENT_ID,CLIENT_NAME,DISPLAY_NAME,department_name,agency_name) 
    VALUES
('Xj93G5rMO2CsouiG8DJf36siQRk','Apply for an Import Licence','DBT - Import Licence','DBT','DBT');


UPDATE conformed_refactored.dim_relying_party_refactored
SET relying_party_name='Apply for an Import Licence'
    ,display_name='DBT - Import Licence'
    ,department_name='DBT'
    ,agency_name='DBT'
WHERE  client_id='Xj93G5rMO2CsouiG8DJf36siQRk';


INSERT INTO conformed_refactored.REF_RELYING_PARTIES_refactored(CLIENT_ID,CLIENT_NAME,DISPLAY_NAME,department_name,agency_name) 
    VALUES
('gSKx5snZtYsQWSQZRoKI2oV-7lQ','Apply for an Export Certificate','DBT - Import Licence','DBT','DBT');


UPDATE conformed_refactored.dim_relying_party_refactored
SET relying_party_name='Apply for an Export Certificate'
    ,display_name='DBT - Export Certificate'
    ,department_name='DBT'
    ,agency_name='DBT'
WHERE  client_id='gSKx5snZtYsQWSQZRoKI2oV-7lQ';


UPDATE conformed_refactored.dim_relying_party_refactored
SET  display_name='HO - Immigration Advisor Self-Service' 
WHERE  client_id='Gk-D7WMvytB44Nze7oEC5KcThQZ4yl7sAA';