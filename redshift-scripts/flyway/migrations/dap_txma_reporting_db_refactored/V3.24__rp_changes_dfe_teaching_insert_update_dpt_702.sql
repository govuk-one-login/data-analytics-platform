INSERT INTO conformed_refactored.REF_RELYING_PARTIES_refactored(CLIENT_ID,CLIENT_NAME,DISPLAY_NAME,department_name,agency_name) 
    VALUES
('CVZjwDf4DJROtdPH2vStPXUALrM','Teaching Vacancies','DFE - Teaching Vacancies','DFE','DFE');


UPDATE conformed_refactored.dim_relying_party_refactored
SET relying_party_name='Teaching Vacancies'
    ,display_name='DFE - Teaching Vacancies'
    ,department_name='DFE'
    ,agency_name='DFE'
WHERE  client_id='CVZjwDf4DJROtdPH2vStPXUALrM';