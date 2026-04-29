--DESNZ - Ofgem Supplier Upload Portal

INSERT INTO conformed_refactored.REF_RELYING_PARTIES_refactored(CLIENT_ID,CLIENT_NAME,DISPLAY_NAME,department_name,agency_name) 
SELECT 'dTKJW0U9EpT2TeU5J7QAaLk0Tug','Ofgem Supplier Upload Portal','DESNZ - Ofgem Supplier Upload Portal','DESNZ','DESNZ'
WHERE NOT EXISTS (
    SELECT 1
    FROM conformed_refactored.REF_RELYING_PARTIES_refactored
    WHERE client_id = 'dTKJW0U9EpT2TeU5J7QAaLk0Tug');

UPDATE conformed_refactored.dim_relying_party_refactored
SET relying_party_name='Ofgem Supplier Upload Portal'
    ,display_name='DESNZ - Ofgem Supplier Upload Portal'
    ,department_name='DESNZ'
    ,agency_name='DESNZ'
WHERE  client_id='dTKJW0U9EpT2TeU5J7QAaLk0Tug';