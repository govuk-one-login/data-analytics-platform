--updates for IJ_TuVEgIqAWT2mCe9b5uocMyNs

UPDATE conformed_refactored.dim_relying_party_refactored
SET relying_party_name='Targeted Retention Incentives for Further Education Teachers'
    ,display_name='DFE - Targeted Retention Incentives for Further Education Teachers'
WHERE  client_id='IJ_TuVEgIqAWT2mCe9b5uocMyNs';


UPDATE conformed_refactored.ref_relying_parties_refactored
SET client_name='Targeted Retention Incentives for Further Education Teachers'
    ,display_name='DFE - Targeted Retention Incentives for Further Education Teachers'
WHERE  client_id='IJ_TuVEgIqAWT2mCe9b5uocMyNs';


--updates for 6Rsn6Xg-Focyzjct9MdVuz1tvgc

INSERT INTO conformed_refactored.REF_RELYING_PARTIES_refactored(CLIENT_ID,CLIENT_NAME,DISPLAY_NAME,department_name,agency_name) 
SELECT '6Rsn6Xg-Focyzjct9MdVuz1tvgc', 'Claim Additional Payment for Teaching: Early Years', 'DFE - Claim Additional Payment for Teaching: Early Years','DWP','DFE'
WHERE NOT EXISTS (
    SELECT 1
    FROM conformed_refactored.REF_RELYING_PARTIES_refactored
    WHERE client_id = '6Rsn6Xg-Focyzjct9MdVuz1tvgc'
);


UPDATE conformed_refactored.dim_relying_party_refactored
SET relying_party_name='Claim Additional Payment for Teaching: Early Years'
    ,display_name='DFE - Claim Additional Payment for Teaching: Early Years'
    ,department_name='DBT'
    ,agency_name='DBT'
WHERE  client_id='6Rsn6Xg-Focyzjct9MdVuz1tvgc';

--oNDHNPrkflBnNyNijFx1yr3Kth8

INSERT INTO conformed_refactored.REF_RELYING_PARTIES_refactored(CLIENT_ID,CLIENT_NAME,DISPLAY_NAME,department_name,agency_name) 
SELECT 'oNDHNPrkflBnNyNijFx1yr3Kth8', 'Supplier Cyber Protection Service', 'MOD - Supplier Cyber Protection Service','MOD','MOD'
WHERE NOT EXISTS (
    SELECT 1
    FROM conformed_refactored.REF_RELYING_PARTIES_refactored
    WHERE client_id = 'oNDHNPrkflBnNyNijFx1yr3Kth8'
);

UPDATE conformed_refactored.dim_relying_party_refactored
SET relying_party_name='Supplier Cyber Protection Service'
    ,display_name='MOD - Supplier Cyber Protection Service'
    ,department_name='MOD'
    ,agency_name='MOD'
WHERE  client_id='oNDHNPrkflBnNyNijFx1yr3Kth8';

--updates for QCiNhw5sqzxzn0nCNP-QDAc-JuQ

INSERT INTO conformed_refactored.REF_RELYING_PARTIES_refactored(CLIENT_ID,CLIENT_NAME,DISPLAY_NAME,department_name,agency_name) 
SELECT '6Rsn6Xg-Focyzjct9MdVuz1tvgc', 'Civil Service Jobs', 'CO - National Maritime Single Window','CO','CO'
WHERE NOT EXISTS (
    SELECT 1
    FROM conformed_refactored.REF_RELYING_PARTIES_refactored
    WHERE client_id = 'QCiNhw5sqzxzn0nCNP-QDAc-JuQ'
);


UPDATE conformed_refactored.dim_relying_party_refactored
SET relying_party_name='Civil Service Jobs'
    ,display_name='CO - National Maritime Single Window'
    ,department_name='CO'
    ,agency_name='CO'
WHERE  client_id='QCiNhw5sqzxzn0nCNP-QDAc-JuQ';


--updates for x0cK4DGNDnCXmsPrYC6cJRV1LC0

INSERT INTO conformed_refactored.REF_RELYING_PARTIES_refactored(CLIENT_ID,CLIENT_NAME,DISPLAY_NAME,department_name,agency_name) 
SELECT '6Rsn6Xg-Focyzjct9MdVuz1tvgc', 'National Security and Investment', 'CO - National Security and Investment','CO','CO'
WHERE NOT EXISTS (
    SELECT 1
    FROM conformed_refactored.REF_RELYING_PARTIES_refactored
    WHERE client_id = 'x0cK4DGNDnCXmsPrYC6cJRV1LC0'
);


UPDATE conformed_refactored.dim_relying_party_refactored
SET relying_party_name='National Security and Investment'
    ,display_name='CO - National Security and Investment'
    ,department_name='CO'
    ,agency_name='CO'
WHERE  client_id='x0cK4DGNDnCXmsPrYC6cJRV1LC0';

--updates for B9KZl6C1T3h4rYswq84GF2okyFk

INSERT INTO conformed_refactored.REF_RELYING_PARTIES_refactored(CLIENT_ID,CLIENT_NAME,DISPLAY_NAME,department_name,agency_name) 
SELECT '6Rsn6Xg-Focyzjct9MdVuz1tvgc', 'Find Teacher Training Courses', 'DFE - Find Teacher Training Courses','DFE','DFE'
WHERE NOT EXISTS (
    SELECT 1
    FROM conformed_refactored.REF_RELYING_PARTIES_refactored
    WHERE client_id = 'B9KZl6C1T3h4rYswq84GF2okyFk'
);


UPDATE conformed_refactored.dim_relying_party_refactored
SET relying_party_name='Find Teacher Training Courses'
    ,display_name='DFE - Find Teacher Training Courses'
    ,department_name='DFE'
    ,agency_name='DFE'
WHERE  client_id='B9KZl6C1T3h4rYswq84GF2okyFk';