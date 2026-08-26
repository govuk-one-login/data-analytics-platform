--WG - Use Welsh in Your Business with Helo Blod

INSERT INTO conformed_refactored.REF_RELYING_PARTIES_refactored(CLIENT_ID,CLIENT_NAME,DISPLAY_NAME,department_name,agency_name) 
SELECT 'JZruYL8YQ_V_3Pp3L7gJcqdcq5M','Use Welsh in Your Business with Helo Blod','WG - Use Welsh in Your Business with Helo Blod','WG','WG'
WHERE NOT EXISTS (
    SELECT 1
    FROM conformed_refactored.REF_RELYING_PARTIES_refactored
    WHERE client_id = 'JZruYL8YQ_V_3Pp3L7gJcqdcq5M');


UPDATE conformed_refactored.dim_relying_party_refactored
SET relying_party_name = 'Use Welsh in Your Business with Helo Blod',
    display_name      = 'WG - Use Welsh in Your Business with Helo Blod',
    department_name   = 'WG',
    agency_name       = 'WG'
WHERE client_id = 'JZruYL8YQ_V_3Pp3L7gJcqdcq5M';