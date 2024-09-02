INSERT INTO conformed_refactored.REF_RELYING_PARTIES_refactored(CLIENT_ID,CLIENT_NAME,DISPLAY_NAME,department_name,agency_name) 
    VALUES
('IJ_TuVEgIqAWT2mCe9b5uocMyNs','Claim Additional Payments for Teaching','DFE - Claim Additional Payments for Teaching','DFE','DFE');


UPDATE conformed_refactored.dim_relying_party_refactored
SET relying_party_name='Claim Additional Payments for Teaching'
    ,display_name='DFE - Claim Additional Payments for Teaching'
    ,department_name='DFE'
    ,agency_name='DFE'
WHERE  client_id='IJ_TuVEgIqAWT2mCe9b5uocMyNs';