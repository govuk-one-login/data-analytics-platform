--SLC - Apply for or Manage your Student Finance

INSERT INTO conformed_refactored.REF_RELYING_PARTIES_refactored
(CLIENT_ID,CLIENT_NAME,DISPLAY_NAME
,department_name,agency_name) 
SELECT 's_YZn49B7nFnSinIlYFGD3yIS0U','Apply for or Manage your Student Finance'
       ,'SLC - Apply for or Manage your Student Finance'
       ,'DFE'
       ,'SLC'
WHERE NOT EXISTS (
    SELECT 1
    FROM conformed_refactored.REF_RELYING_PARTIES_refactored
    WHERE client_id = 's_YZn49B7nFnSinIlYFGD3yIS0U');


UPDATE conformed_refactored.dim_relying_party_refactored
SET relying_party_name = 'Apply for or Manage your Student Finance',
    display_name      = 'SLC - Apply for or Manage your Student Finance',
    department_name   = 'DFE',
    agency_name       = 'SLC'
WHERE client_id = 's_YZn49B7nFnSinIlYFGD3yIS0U';



--SLC - Update your Employment Details with the Student Loans Company

INSERT INTO conformed_refactored.REF_RELYING_PARTIES_refactored
(CLIENT_ID,CLIENT_NAME,DISPLAY_NAME
,department_name,agency_name) 
SELECT '9SkhCaKfuz0jFmgDd6OtWTVgBvA','Update your Employment Details with the Student Loans Company'
       ,'SLC - Update your Employment Details with the Student Loans Company'
       ,'DFE'
       ,'SLC'
WHERE NOT EXISTS (
    SELECT 1
    FROM conformed_refactored.REF_RELYING_PARTIES_refactored
    WHERE client_id = '9SkhCaKfuz0jFmgDd6OtWTVgBvA');


UPDATE conformed_refactored.dim_relying_party_refactored
SET relying_party_name = 'Update your Employment Details with the Student Loans Company',
    display_name      = 'SLC - Update your Employment Details with the Student Loans Company',
    department_name   = 'DFE',
    agency_name       = 'SLC'
WHERE client_id = '9SkhCaKfuz0jFmgDd6OtWTVgBvA';



--SLC - Update your Employment Details with the Student Loans Company

INSERT INTO conformed_refactored.REF_RELYING_PARTIES_refactored
(CLIENT_ID,CLIENT_NAME,DISPLAY_NAME
,department_name,agency_name) 
SELECT 'DY8Amii0Y5fBuUCfqyN5OBLl70A','Heat Energy Advice'
       ,'DESNZ - Heat Energy Advice'
       ,'DESNZ'
       ,'DESNZ'
WHERE NOT EXISTS (
    SELECT 1
    FROM conformed_refactored.REF_RELYING_PARTIES_refactored
    WHERE client_id = 'DY8Amii0Y5fBuUCfqyN5OBLl70A');


UPDATE conformed_refactored.dim_relying_party_refactored
SET relying_party_name = 'Heat Energy Advice',
    display_name      = 'DESNZ - Heat Energy Advice',
    department_name   = 'DESNZ',
    agency_name       = 'DESNZ'
WHERE client_id = 'DY8Amii0Y5fBuUCfqyN5OBLl70A';