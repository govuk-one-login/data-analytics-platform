--Ofgem - Boiler Upgrade Scheme

INSERT INTO conformed_refactored.REF_RELYING_PARTIES_refactored
(CLIENT_ID,CLIENT_NAME,DISPLAY_NAME
,department_name,agency_name) 
SELECT 'P3wuL8iIGnKEGCNLwgEVUX7S1eM','Boiler Upgrade Scheme'
       ,'Ofgem - Boiler Upgrade Scheme'
       ,'DESNZ'
       ,'Ofgem'
WHERE NOT EXISTS (
    SELECT 1
    FROM conformed_refactored.REF_RELYING_PARTIES_refactored
    WHERE client_id = 'P3wuL8iIGnKEGCNLwgEVUX7S1eM');


UPDATE conformed_refactored.dim_relying_party_refactored
SET relying_party_name = 'Boiler Upgrade Scheme',
    display_name      = 'Ofgem - Boiler Upgrade Scheme',
    department_name   = 'DESNZ',
    agency_name       = 'Ofgem'
WHERE client_id = 'P3wuL8iIGnKEGCNLwgEVUX7S1eM';