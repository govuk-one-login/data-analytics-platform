
--Standard Enhanced Application Services 

INSERT INTO conformed_refactored.REF_RELYING_PARTIES_refactored(CLIENT_ID,CLIENT_NAME,DISPLAY_NAME,department_name,agency_name) 
    VALUES
('PVTFrS4kgHYHFDqEb5IFanlIfcM','Standard Enhanced Application Services','DBS - Standard Enhanced Application Services','HO','DBS');


UPDATE conformed_refactored.dim_relying_party_refactored
SET relying_party_name='Standard Enhanced Application Services'
    ,display_name='DBS - Standard Enhanced Application Services'
    ,department_name='HO'
    ,agency_name='DBS'
WHERE  client_id='PVTFrS4kgHYHFDqEb5IFanlIfcM';

--Disclosure and Online Results Service

INSERT INTO conformed_refactored.REF_RELYING_PARTIES_refactored(CLIENT_ID,CLIENT_NAME,DISPLAY_NAME,department_name,agency_name) 
    VALUES
('Y12SlXI_zqYj_z6FFtVHExHjEO8','Disclosure and Online Results Service','DBS - Disclosure and Online Results Service','HO','DBS');


UPDATE conformed_refactored.dim_relying_party_refactored
SET relying_party_name='Disclosure and Online Results Service'
    ,display_name='DBS - Disclosure and Online Results Service'
    ,department_name='HO'
    ,agency_name='DBS'
WHERE  client_id='Y12SlXI_zqYj_z6FFtVHExHjEO8';

--Supplier Cyber Protection Service

INSERT INTO conformed_refactored.REF_RELYING_PARTIES_refactored(CLIENT_ID,CLIENT_NAME,DISPLAY_NAME,department_name,agency_name) 
    VALUES
('oNDHNPrkflBnNyNijFx1yr3Kth8','Supplier Cyber Protection Service','MOD - Supplier Cyber Protection Service','MOD','MOD');


UPDATE conformed_refactored.dim_relying_party_refactored
SET relying_party_name='Supplier Cyber Protection Service'
    ,display_name='MOD - Supplier Cyber Protection Service'
    ,department_name='MOD'
    ,agency_name='MOD'
WHERE  client_id='oNDHNPrkflBnNyNijFx1yr3Kth8';


--Submit Cosmetic Product Notification

INSERT INTO conformed_refactored.REF_RELYING_PARTIES_refactored(CLIENT_ID,CLIENT_NAME,DISPLAY_NAME,department_name,agency_name) 
    VALUES
('JhyNhK1J8oe9-Mnn05HQbeKhttk','Submit Cosmetic Product Notification','DBT - Submit Cosmetic Product Notification','DBT','DBT');


UPDATE conformed_refactored.dim_relying_party_refactored
SET relying_party_name='Submit Cosmetic Product Notification'
    ,display_name='DBT - Submit Cosmetic Product Notification'
    ,department_name='DBT'
    ,agency_name='DBT'
WHERE  client_id='JhyNhK1J8oe9-Mnn05HQbeKhttk';


--Apply for Teacher Training

INSERT INTO conformed_refactored.REF_RELYING_PARTIES_refactored(CLIENT_ID,CLIENT_NAME,DISPLAY_NAME,department_name,agency_name) 
    VALUES
('wo1OYi8Z2fCQEX-9B8IPS2-F-ZE','Apply for Teacher Training','DFE - Apply for Teacher Training','DFE','DFE');


UPDATE conformed_refactored.dim_relying_party_refactored
SET relying_party_name='Apply for Teacher Training'
    ,display_name='DFE - Apply for Teacher Training'
    ,department_name='DFE'
    ,agency_name='DFE'
WHERE  client_id='wo1OYi8Z2fCQEX-9B8IPS2-F-ZE';

--Rural Payment Wales

INSERT INTO conformed_refactored.REF_RELYING_PARTIES_refactored(CLIENT_ID,CLIENT_NAME,DISPLAY_NAME,department_name,agency_name) 
    VALUES
('SdpFRM0HdX38FfdbgRX8qzTl8sm','Rural Payment Wales','WG - Rural Payment Wales','WG','WG');


UPDATE conformed_refactored.dim_relying_party_refactored
SET relying_party_name='Rural Payment Wales'
    ,display_name='WG - Rural Payment Wales'
    ,department_name='WG'
    ,agency_name='WG'
WHERE  client_id='SdpFRM0HdX38FfdbgRX8qzTl8sm';