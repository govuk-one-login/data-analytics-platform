--Heat Network Zoning Portal

INSERT INTO conformed_refactored.REF_RELYING_PARTIES_refactored(CLIENT_ID,CLIENT_NAME,DISPLAY_NAME,department_name,agency_name) 
    VALUES
('gFVZdC1P4b7fobLgsN2eBVmVC8w','Heat Network Zoning Portal','DESNZ - Heat Network Zoning Portal','DESNZ','DESNZ');


UPDATE conformed_refactored.dim_relying_party_refactored
SET relying_party_name='Heat Network Zoning Portal'
    ,display_name='DESNZ - Heat Network Zoning Portal'
    ,department_name='DESNZ'
    ,agency_name='DESNZ'
WHERE  client_id='gFVZdC1P4b7fobLgsN2eBVmVC8w';


--Manage Intellectual Property

INSERT INTO conformed_refactored.REF_RELYING_PARTIES_refactored(CLIENT_ID,CLIENT_NAME,DISPLAY_NAME,department_name,agency_name) 
    VALUES
('Mh3SUEDHB74A2SIB_1VAXZKG_iw','Manage Intellectual Property','DSIT - Manage Intellectual Property','DSIT','IPO');


UPDATE conformed_refactored.dim_relying_party_refactored
SET relying_party_name='Manage Intellectual Property'
    ,display_name='DSIT - Manage Intellectual Property'
    ,department_name='DSIT'
    ,agency_name='IPO'
WHERE  client_id='Mh3SUEDHB74A2SIB_1VAXZKG_iw';