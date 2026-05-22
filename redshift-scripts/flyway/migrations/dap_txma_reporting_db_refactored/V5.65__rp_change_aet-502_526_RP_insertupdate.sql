--DFE - DEFRA - Apply for a Tree Felling Licence

INSERT INTO conformed_refactored.REF_RELYING_PARTIES_refactored(CLIENT_ID,CLIENT_NAME,DISPLAY_NAME,department_name,agency_name) 
SELECT 'DQj6sd_d9n0ZC0HeIUxaprMRsgM','Apply for a Tree Felling Licence','DEFRA - Apply for a Tree Felling Licence','DEFRA','FC'
WHERE NOT EXISTS (
    SELECT 1
    FROM conformed_refactored.REF_RELYING_PARTIES_refactored
    WHERE client_id = 'DQj6sd_d9n0ZC0HeIUxaprMRsgM');


UPDATE conformed_refactored.dim_relying_party_refactored
SET relying_party_name = 'Apply for a Tree Felling Licence',
    display_name      = 'DEFRA - Apply for a Tree Felling Licence',
    department_name   = 'DEFRA',
    agency_name       = 'FC'
WHERE client_id = 'DQj6sd_d9n0ZC0HeIUxaprMRsgM';



--Heat Network Technical Assurance Scheme

INSERT INTO conformed_refactored.REF_RELYING_PARTIES_refactored(CLIENT_ID,CLIENT_NAME,DISPLAY_NAME,department_name,agency_name) 
SELECT '7GfZd9BDeYbXvEAkJKlORRGq6XI','Heat Network Technical Assurance Scheme','DESNZ - Heat Network Technical Assurance Scheme','DESNZ','DESNZ'
WHERE NOT EXISTS (
    SELECT 1
    FROM conformed_refactored.REF_RELYING_PARTIES_refactored
    WHERE client_id = '7GfZd9BDeYbXvEAkJKlORRGq6XI');

UPDATE conformed_refactored.dim_relying_party_refactored
SET relying_party_name='Heat Network Technical Assurance Scheme'
    ,display_name='DESNZ - Heat Network Technical Assurance Scheme'
    ,department_name='DESNZ'
    ,agency_name='DESNZ'
WHERE  client_id='7GfZd9BDeYbXvEAkJKlORRGq6XI';
