--DWP - Pension Credit and Housing Benefit Service

INSERT INTO conformed_refactored.REF_RELYING_PARTIES_refactored
(CLIENT_ID,CLIENT_NAME,DISPLAY_NAME
,department_name,agency_name) 
SELECT 'BpXX_-K6fIu5arrpmFap1TGPHVk'
       ,'Pension Credit and Housing Benefit Service'
       ,'DWP - Pension Credit and Housing Benefit Service'
       ,'DWP'
       ,'DWP'
WHERE NOT EXISTS (
    SELECT 1
    FROM conformed_refactored.REF_RELYING_PARTIES_refactored
    WHERE client_id = 'BpXX_-K6fIu5arrpmFap1TGPHVk');


UPDATE conformed_refactored.dim_relying_party_refactored
SET relying_party_name = 'Pension Credit and Housing Benefit Service',
    display_name      = 'DWP - Pension Credit and Housing Benefit Service',
    department_name   = 'DWP',
    agency_name       = 'DWP'
WHERE client_id = 'BpXX_-K6fIu5arrpmFap1TGPHVk';


--MOD - Apply for Armed Forces Compensation or a War Pension

INSERT INTO conformed_refactored.REF_RELYING_PARTIES_refactored
(CLIENT_ID,CLIENT_NAME,DISPLAY_NAME
,department_name,agency_name) 
SELECT '74NWQkDxoeDG6P3sPdzEk4ZD19Y'
       ,'Apply for Armed Forces Compensation or a War Pension'
       ,'MOD - Apply for Armed Forces Compensation or a War Pension'
       ,'MOD'
       ,'MOD'
WHERE NOT EXISTS (
    SELECT 1
    FROM conformed_refactored.REF_RELYING_PARTIES_refactored
    WHERE client_id = '74NWQkDxoeDG6P3sPdzEk4ZD19Y');


UPDATE conformed_refactored.dim_relying_party_refactored
SET relying_party_name = 'Apply for Armed Forces Compensation or a War Pension',
    display_name      = 'MOD - Apply for Armed Forces Compensation or a War Pension',
    department_name   = 'MOD',
    agency_name       = 'MOD'
WHERE client_id = '74NWQkDxoeDG6P3sPdzEk4ZD19Y';


--WG - Welsh Government Business and Support

INSERT INTO conformed_refactored.REF_RELYING_PARTIES_refactored
(CLIENT_ID,CLIENT_NAME,DISPLAY_NAME
,department_name,agency_name) 
SELECT 'Pbz05yntwJrfoyXj_dvKdE0TfgE'
       ,'Welsh Government Business and Support'
       ,'WG - Welsh Government Business and Support'
       ,'WG'
       ,'WG'
WHERE NOT EXISTS (
    SELECT 1
    FROM conformed_refactored.REF_RELYING_PARTIES_refactored
    WHERE client_id = 'Pbz05yntwJrfoyXj_dvKdE0TfgE');


UPDATE conformed_refactored.dim_relying_party_refactored
SET relying_party_name = 'Welsh Government Business and Support',
    display_name      = 'WG - Welsh Government Business and Support',
    department_name   = 'WG',
    agency_name       = 'WG'
WHERE client_id = 'Pbz05yntwJrfoyXj_dvKdE0TfgE';


--WG - Business Online Support Service

INSERT INTO conformed_refactored.REF_RELYING_PARTIES_refactored
(CLIENT_ID,CLIENT_NAME,DISPLAY_NAME
,department_name,agency_name) 
SELECT 'ozjDqT8nalrJiMlLwOZHAGVCI5A'
       ,'Business Online Support Service'
       ,'WG - Business Online Support Service'
       ,'WG'
       ,'WG'
WHERE NOT EXISTS (
    SELECT 1
    FROM conformed_refactored.REF_RELYING_PARTIES_refactored
    WHERE client_id = 'ozjDqT8nalrJiMlLwOZHAGVCI5A');


UPDATE conformed_refactored.dim_relying_party_refactored
SET relying_party_name = 'Business Online Support Service',
    display_name      = 'WG - Business Online Support Service',
    department_name   = 'WG',
    agency_name       = 'WG'
WHERE client_id = 'ozjDqT8nalrJiMlLwOZHAGVCI5A';


--WG - Business Online Support Service

INSERT INTO conformed_refactored.REF_RELYING_PARTIES_refactored
(CLIENT_ID,CLIENT_NAME,DISPLAY_NAME
,department_name,agency_name) 
SELECT 'eOdiLYgDEhC7nccrVaObaQ4AgEE'
       ,'Make a Lasting Power of Attorney'
       ,'MOJ - Make a Lasting Power of Attorney'
       ,'MOJ'
       ,'MOJ'
WHERE NOT EXISTS (
    SELECT 1
    FROM conformed_refactored.REF_RELYING_PARTIES_refactored
    WHERE client_id = 'eOdiLYgDEhC7nccrVaObaQ4AgEE');


UPDATE conformed_refactored.dim_relying_party_refactored
SET relying_party_name = 'Make a Lasting Power of Attorney',
    display_name      = 'MOJ - Make a Lasting Power of Attorney',
    department_name   = 'MOJ',
    agency_name       = 'MOJ'
WHERE client_id = 'eOdiLYgDEhC7nccrVaObaQ4AgEE';