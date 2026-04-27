--DESNZ - Submit Your Energy Infrastructure Application

INSERT INTO conformed_refactored.REF_RELYING_PARTIES_refactored(CLIENT_ID,CLIENT_NAME,DISPLAY_NAME,department_name,agency_name) 
SELECT 'rzu_1wrYlk1XsKZ9JkjQTJU4DJc','Submit Your Energy Infrastructure Application','DESNZ - Submit Your Energy Infrastructure Application','DESNZ','DESNZ'
WHERE NOT EXISTS (
    SELECT 1
    FROM conformed_refactored.REF_RELYING_PARTIES_refactored
    WHERE client_id = 'rzu_1wrYlk1XsKZ9JkjQTJU4DJc');

UPDATE conformed_refactored.dim_relying_party_refactored
SET relying_party_name='Submit Your Energy Infrastructure Application'
    ,display_name='DESNZ - Submit Your Energy Infrastructure Application'
    ,department_name='DESNZ'
    ,agency_name='DESNZ'
WHERE  client_id='rzu_1wrYlk1XsKZ9JkjQTJU4DJc';


--DWP - Jobs & Careers Service

INSERT INTO conformed_refactored.REF_RELYING_PARTIES_refactored(CLIENT_ID,CLIENT_NAME,DISPLAY_NAME,department_name,agency_name) 
SELECT 'yRWIdxT-iKnZlvig4JHLzYIn0KM','Jobs & Careers Service','DWP - Jobs & Careers Service','DWP','DWP'
WHERE NOT EXISTS (
    SELECT 1
    FROM conformed_refactored.REF_RELYING_PARTIES_refactored
    WHERE client_id = 'yRWIdxT-iKnZlvig4JHLzYIn0KM');

UPDATE conformed_refactored.dim_relying_party_refactored
SET relying_party_name='Jobs & Careers Service'
    ,display_name='DWP - Jobs & Careers Service'
    ,department_name='DWP'
    ,agency_name='DWP'
WHERE  client_id='yRWIdxT-iKnZlvig4JHLzYIn0KM';