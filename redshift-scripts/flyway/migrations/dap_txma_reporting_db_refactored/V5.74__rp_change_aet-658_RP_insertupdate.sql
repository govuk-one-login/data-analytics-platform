--DESNZ - Warm Homes Discount

INSERT INTO conformed_refactored.REF_RELYING_PARTIES_refactored(CLIENT_ID,CLIENT_NAME,DISPLAY_NAME,department_name,agency_name) 
SELECT '7cShJ866xD0KxiGjME8c3mZzOxk','Warm Homes Discount','DESNZ - Warm Homes Discount','DESNZ','DESNZ'
WHERE NOT EXISTS (
    SELECT 1
    FROM conformed_refactored.REF_RELYING_PARTIES_refactored
    WHERE client_id = '7cShJ866xD0KxiGjME8c3mZzOxk');


UPDATE conformed_refactored.dim_relying_party_refactored
SET relying_party_name = 'Warm Homes Discount',
    display_name      = 'DESNZ - Warm Homes Discount',
    department_name   = 'DESNZ',
    agency_name       = 'DESNZ'
WHERE client_id = '7cShJ866xD0KxiGjME8c3mZzOxk';