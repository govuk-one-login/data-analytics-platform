INSERT INTO conformed_refactored.REF_RELYING_PARTIES_refactored(CLIENT_ID,CLIENT_NAME,DISPLAY_NAME,department_name,agency_name) 
    VALUES
('Q2tqV5C1nGXFVMUcnpqbOUTrZuw','Confirm my Apprenticeship Details','NAS  - Confirm my Apprenticeship Details','DFE','NAS');


UPDATE conformed_refactored.dim_relying_party_refactored
SET relying_party_name='Confirm my Apprenticeship Details'
    ,display_name='NAS  - Confirm my Apprenticeship Details'
    ,department_name='DFE'
    ,agency_name='NAS'
WHERE  client_id='Q2tqV5C1nGXFVMUcnpqbOUTrZuw';