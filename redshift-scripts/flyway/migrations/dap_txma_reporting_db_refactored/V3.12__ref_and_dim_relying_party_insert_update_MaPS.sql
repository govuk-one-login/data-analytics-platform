INSERT INTO conformed_refactored.REF_RELYING_PARTIES_refactored(CLIENT_ID,CLIENT_NAME,DISPLAY_NAME,department_name,agency_name) 
    VALUES
('sdlgbEirK30fvgbrf0C78XY60qN','PDP Connection Portal','MaPS - PDP Connection Portal','DWP','MaPS');


UPDATE conformed_refactored.dim_relying_party_refactored
SET relying_party_name='PDP Connection Portal'
    ,display_name='MaPS - PDP Connection Portal'
    ,department_name='DWP'
    ,agency_name='MaPS'
WHERE  client_id='sdlgbEirK30fvgbrf0C78XY60qN';