--Childcare Offer for Wales: Parents

INSERT INTO conformed_refactored.REF_RELYING_PARTIES_refactored(CLIENT_ID,CLIENT_NAME,DISPLAY_NAME,department_name,agency_name) 
    VALUES
('gdSTmZ0aYkk8_WelrcniDkFKOMw','Childcare Offer for Wales: Parents','WG - Childcare Offer for Wales: Parents','WG','WG');


UPDATE conformed_refactored.dim_relying_party_refactored
SET relying_party_name='Childcare Offer for Wales: Parents'
    ,display_name='WG - Childcare Offer for Wales: Parents'
    ,department_name='WG'
    ,agency_name='WG'
WHERE  client_id='gdSTmZ0aYkk8_WelrcniDkFKOMw';

--Childcare Offer for Wales: Providers

UPDATE conformed_refactored.REF_RELYING_PARTIES_refactored
SET  client_name='Childcare Offer for Wales: Providers'
    ,display_name='WG - Childcare Offer for Wales: Providers'
WHERE  client_id='zxpIi7Wg-Opj9nSIluDLIwMP3V0';

UPDATE conformed_refactored.dim_relying_party_refactored
SET  relying_party_name='Childcare Offer for Wales: Providers'
    ,display_name='WG - Childcare Offer for Wales: Providers'
WHERE  client_id='zxpIi7Wg-Opj9nSIluDLIwMP3V0';