UPDATE conformed_refactored.REF_RELYING_PARTIES_refactored
SET  CLIENT_NAME='Targeted Retention Incentives for Further Education Teachers'
    ,display_name='DFE - Targeted Retention Incentives for Further Education Teachers'
    ,department_name='DFE'
    ,agency_name='DFE' 
WHERE  client_id='IJ_TuVEgIqAWT2mCe9b5uocMyNs';

UPDATE conformed_refactored.dim_relying_party_refactored
SET relying_party_name='Targeted Retention Incentives for Further Education Teachers'
    ,display_name='DFE - Targeted Retention Incentives for Further Education Teachers'
    ,department_name='DFE'
    ,agency_name='DFE'
    ,modified_date=current_date
WHERE  client_id='IJ_TuVEgIqAWT2mCe9b5uocMyNs';
