--DCMS - Short Term Lets Registration Scheme

INSERT INTO conformed_refactored.REF_RELYING_PARTIES_refactored(CLIENT_ID,CLIENT_NAME,DISPLAY_NAME,department_name,agency_name) 
SELECT 'vIJp3ifH_yAF_Z0DQbvuM80BcUw','Short Term Lets Registration Scheme','DCMS - Short Term Lets Registration Scheme','DCMS','DCMS'
WHERE NOT EXISTS (
    SELECT 1
    FROM conformed_refactored.REF_RELYING_PARTIES_refactored
    WHERE client_id = 'vIJp3ifH_yAF_Z0DQbvuM80BcUw'
);