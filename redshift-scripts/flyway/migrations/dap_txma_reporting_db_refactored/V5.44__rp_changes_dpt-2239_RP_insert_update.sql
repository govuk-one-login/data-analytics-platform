--DCMS - Short Term Lets Registration Scheme

INSERT INTO conformed_refactored.REF_RELYING_PARTIES_refactored(CLIENT_ID,CLIENT_NAME,DISPLAY_NAME,department_name,agency_name) 
SELECT 'vIJp3ifH_yAF_Z0DQbvuM80BcUw','Short Term Lets Registration Scheme','DCMS - Short Term Lets Registration Scheme','DCMS','DCMS'
WHERE NOT EXISTS (
    SELECT 1
    FROM conformed_refactored.REF_RELYING_PARTIES_refactored
    WHERE client_id = 'vIJp3ifH_yAF_Z0DQbvuM80BcUw'
);

UPDATE conformed_refactored.dim_relying_party_refactored
SET relying_party_name='Short Term Lets Registration Scheme'
    ,display_name='DCMS - Short Term Lets Registration Scheme'
    ,department_name='DCMS'
    ,agency_name='DCMS'
WHERE  client_id='vIJp3ifH_yAF_Z0DQbvuM80BcUw';



--MHCLG - Energy Performance of Buildings Data Platform

INSERT INTO conformed_refactored.REF_RELYING_PARTIES_refactored(CLIENT_ID,CLIENT_NAME,DISPLAY_NAME,department_name,agency_name) 
SELECT 'H_F1fKr2H20kQ6TJhgz5k3-KzTc','Energy Performance of Buildings Data Platform','MHCLG - Energy Performance of Buildings Data Platform','MHCLG','MHCLG'
WHERE NOT EXISTS (
    SELECT 1
    FROM conformed_refactored.REF_RELYING_PARTIES_refactored
    WHERE client_id = 'H_F1fKr2H20kQ6TJhgz5k3-KzTc'
);

UPDATE conformed_refactored.dim_relying_party_refactored
SET relying_party_name='Energy Performance of Buildings Data Platform'
    ,display_name='MHCLG - Energy Performance of Buildings Data Platform'
    ,department_name='MHCLG'
    ,agency_name='MHCLG'
WHERE  client_id='H_F1fKr2H20kQ6TJhgz5k3-KzTc';


--DFE - Get Ready to Teach

INSERT INTO conformed_refactored.REF_RELYING_PARTIES_refactored(CLIENT_ID,CLIENT_NAME,DISPLAY_NAME,department_name,agency_name) 
SELECT 'vjp-5BDhot33nZ2TmZMmLNrCxhE','Get Ready to Teach','DFE - Get Ready to Teach','DFE','DFE'
WHERE NOT EXISTS (
    SELECT 1
    FROM conformed_refactored.REF_RELYING_PARTIES_refactored
    WHERE client_id = 'vjp-5BDhot33nZ2TmZMmLNrCxhE'
);

UPDATE conformed_refactored.dim_relying_party_refactored
SET relying_party_name='Get Ready to Teach'
    ,display_name='DFE - Get Ready to Teach'
    ,department_name='DFE'
    ,agency_name='DFE'
WHERE  client_id='vjp-5BDhot33nZ2TmZMmLNrCxhE';


--DWP - Customer View

INSERT INTO conformed_refactored.REF_RELYING_PARTIES_refactored(CLIENT_ID,CLIENT_NAME,DISPLAY_NAME,department_name,agency_name) 
SELECT 'fFINUNDOgj6yjWru8UUlfNvuz94','Customer View','DWP - Customer View','DWP','DWP'
WHERE NOT EXISTS (
    SELECT 1
    FROM conformed_refactored.REF_RELYING_PARTIES_refactored
    WHERE client_id = 'fFINUNDOgj6yjWru8UUlfNvuz94'
);

UPDATE conformed_refactored.dim_relying_party_refactored
SET relying_party_name='Customer View'
    ,display_name='DWP - Customer View'
    ,department_name='DWP'
    ,agency_name='DWP'
WHERE  client_id='fFINUNDOgj6yjWru8UUlfNvuz94';