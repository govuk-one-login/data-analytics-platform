--DFE - Digital Certification

INSERT INTO conformed_refactored.REF_RELYING_PARTIES_refactored(CLIENT_ID,CLIENT_NAME,DISPLAY_NAME,department_name,agency_name) 
SELECT 'CEWySFSPKpDSIsg7ooTZoaGYPLI','Digital Certification','DFE - Digital Certification,'DFE','NAS'
WHERE NOT EXISTS (
    SELECT 1
    FROM conformed_refactored.REF_RELYING_PARTIES_refactored
    WHERE client_id = 'CEWySFSPKpDSIsg7ooTZoaGYPLI');

UPDATE conformed_refactored.dim_relying_party_refactored
SET relying_party_name='Digital Certification'
    ,display_name='DFE - Digital Certification'
    ,department_name='DFE'
    ,agency_name='NAS'
WHERE  client_id='CEWySFSPKpDSIsg7ooTZoaGYPLI';


--WG - Skills Hub

INSERT INTO conformed_refactored.REF_RELYING_PARTIES_refactored(CLIENT_ID,CLIENT_NAME,DISPLAY_NAME,department_name,agency_name) 
SELECT 'V69dApWpYRzVOQPHVl6ZJgfCfe0','Skills Hub','WG - Skills Hub,'WG','WG'
WHERE NOT EXISTS (
    SELECT 1
    FROM conformed_refactored.REF_RELYING_PARTIES_refactored
    WHERE client_id = 'V69dApWpYRzVOQPHVl6ZJgfCfe0');

UPDATE conformed_refactored.dim_relying_party_refactored
SET relying_party_name='Skills Hub'
    ,display_name='WG - Skills Hub'
    ,department_name='WG'
    ,agency_name='WG'
WHERE  client_id='V69dApWpYRzVOQPHVl6ZJgfCfe0';