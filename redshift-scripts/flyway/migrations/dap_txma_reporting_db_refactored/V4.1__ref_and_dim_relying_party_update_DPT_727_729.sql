update "conformed_refactored"."ref_relying_parties_refactored"
set client_id='glcH6E9VxtnCAPPwBt550zDh22Q'
, client_name='Air pollution assessment archive'
,display_name='DEFRA - Air pollution assessment archive'
,department_name='DEFRA'
,agency_name='JNCC'
where client_id='WH3OOFBYzTis2qf6lF0pcTzgx2M' ;


update "conformed_refactored"."dim_relying_party_refactored"
set client_id='glcH6E9VxtnCAPPwBt550zDh22Q'
, relying_party_name='Air pollution assessment archive'
,display_name='DEFRA - Air pollution assessment archive'
,department_name='DEFRA'
,agency_name='JNCC'
where client_id='WH3OOFBYzTis2qf6lF0pcTzgx2M' ;



INSERT INTO conformed_refactored.REF_RELYING_PARTIES_refactored(CLIENT_ID,CLIENT_NAME,DISPLAY_NAME,department_name,agency_name) 
    VALUES
('CKHfr_Kz84LYFnsP7m6YJBXqBzw','Check a Family''s Eligibility','DFE - Check a Family''s Eligibility','DFE','DFE');


UPDATE conformed_refactored.dim_relying_party_refactored
SET relying_party_name='Check a Family''s Eligibility'
    ,display_name='DFE - Check a Family''s Eligibility'
    ,department_name='DFE'
    ,agency_name='DFE'
WHERE  client_id='CKHfr_Kz84LYFnsP7m6YJBXqBzw';
