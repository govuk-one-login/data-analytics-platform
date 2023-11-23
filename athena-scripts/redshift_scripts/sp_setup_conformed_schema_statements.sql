CREATE OR REPLACE PROCEDURE conformed.sp_setup_conformed_schema() 
AS $$ 
BEGIN 

    --
    TRUNCATE conformed.ref_events;
    --
    INSERT INTO conformed.ref_events (event_name, product_family, domain, sub_domain, other_sub_domain)
    VALUES
    ('AUTH_AUTHORISATION_INITIATED','AUTH_ORCHESTRATION','Authentication','Relying Parties Connect',' '),
    ('AUTH_CHECK_USER_KNOWN_EMAIL','AUTH_ACCOUNT_USER_LOGIN','Authentication','User Login',' '),
    ('AUTH_CHECK_USER_NO_ACCOUNT_WITH_EMAIL','AUTH_ACCOUNT_CREATION','Authentication','Account Creation',' '),
    ('AUTH_CODE_VERIFIED','AUTH_ACCOUNT_MFA','Authentication','Account MFA',' '),
    ('AUTH_CREATE_ACCOUNT','AUTH_ACCOUNT_CREATION','Authentication','Account Creation',' '),
    ('AUTH_LOG_IN_SUCCESS','AUTH_ACCOUNT_USER_LOGIN','Authentication','User Login',' '),
    ('AUTH_PASSWORD_RESET_SUCCESSFUL','AUTH_ACCOUNT_MANAGEMENT','Authentication','Account Management',' '),
    ('DCMAW_APP_END','DCMAW_CRI','DCMAW','App Journey',' '),
    ('DCMAW_APP_HANDOFF_START','DCMAW_CRI','DCMAW','App Journey',' '),
    ('DCMAW_APP_START','DCMAW_CRI','DCMAW','App Journey',' '),
    ('DCMAW_CRI_START','DCMAW_CRI','DCMAW','CRI',' '),
    ('DCMAW_CRI_VC_ISSUED','DCMAW_CRI','DCMAW','CRI',' '),
    ('DCMAW_DRIVING_LICENCE_SELECTED','DCMAW_CRI','DCMAW','CRI',' '),
    ('DCMAW_PASSPORT_SELECTED','DCMAW_CRI','DCMAW','CRI',' '),
    ('DCMAW_WEB_END','DCMAW_CRI','DCMAW','App Journey',' '),
    ('DCMAW_BRP_SELECTED','DCMAW_CRI','DCMAW','CRI',' '),
    ('IPV_ADDRESS_CRI_START','IPV_CRI_ADDRESS','IPV','Address CRI',' '),
    ('IPV_ADDRESS_CRI_VC_ISSUED','IPV_CRI_ADDRESS','IPV','Address CRI',' '),
    ('IPV_DL_CRI_START','IPV_CRI_DRIVING_LICENSE ','IPV','Driving License',' '),
    ('IPV_DL_CRI_VC_ISSUED','IPV_CRI_DRIVING_LICENSE ','IPV','Driving License',' '),
    ('IPV_FRAUD_CRI_START','IPV_CRI_FRAUD','IPV','Fraud CRI',' '),
    ('IPV_FRAUD_CRI_VC_ISSUED','IPV_CRI_FRAUD','IPV','Fraud CRI',' '),
    ('IPV_IDENTITY_REUSE_COMPLETE','IPV_JOURNEY','IPV','IPV Journey',' '),
    ('IPV_IDENTITY_REUSE_RESET','IPV_JOURNEY','IPV','IPV Journey',''),
    ('IPV_JOURNEY_END','IPV_JOURNEY','IPV','IPV Journey',' '),
    ('IPV_JOURNEY_START','IPV_JOURNEY','IPV','IPV Journey',' '),
    ('IPV_KBV_CRI_START','IPV_CRI_KBV','IPV','KBV CRI',' '),
    ('IPV_KBV_CRI_VC_ISSUED','IPV_CRI_KBV','IPV','KBV CRI',' '),
    ('IPV_PASSPORT_CRI_START','IPV_CRI_PASSPORT','IPV','Passport CRI',' '),
    ('IPV_PASSPORT_CRI_VC_ISSUED','IPV_CRI_PASSPORT','IPV','Passport CRI',' '),
    ('IPV_SPOT_RESPONSE_APPROVED','IPV_JOURNEY','IPV','IPV Journey','SPOT'),
    ('IPV_SPOT_RESPONSE_REJECTED','IPV_JOURNEY','IPV','IPV Journey','SPOT'),
    ('AUTH_AUTH_CODE_ISSUED','AUTH_ACCOUNT_USER_LOGIN','Authentication','User Login','SPOT'),
    ('AUTH_AUTHORISATION_REQUEST_ERROR','AUTH_ORCHESTRATION','Authentication','User Login',' '),
    ('AUTH_AUTHORISATION_REQUEST_RECEIVED','AUTH_ORCHESTRATION','Authentication','Relying Parties Connect',' '),
    ('AUTH_IPV_AUTHORISATION_REQUESTED','AUTH_ORCHESTRATION','Authentication','Relying Parties Connect',' '),
    ('IPV_ADDRESS_CRI_END','IPV_CRI_ADDRESS','IPV','Address CRI',' '),
    ('IPV_ADDRESS_CRI_REQUEST_SENT','IPV_CRI_ADDRESS','IPV','Address CRI',' '),
    ('IPV_FRAUD_CRI_REQUEST_SENT','IPV_CRI_FRAUD','IPV','Fraud CRI',' '),
    ('IPV_FRAUD_CRI_RESPONSE_RECEIVED','IPV_CRI_FRAUD','IPV','Fraud CRI',' '),
    ('IPV_FRAUD_CRI_THIRD_PARTY_REQUEST_ENDED','IPV_CRI_FRAUD','IPV','Fraud CRI',' '),
    ('CIC_CRI_AUTH_CODE_ISSUED','IPV_CRI_CIC','IPV','CIC CRI',' '),
    ('CIC_CRI_START','IPV_CRI_CIC','IPV','CIC CRI',' '),
    ('CIC_CRI_VC_ISSUED','IPV_CRI_CIC','IPV','CIC CRI',' '),
    ('F2F_CRI_AUTH_CODE_ISSUED','IPV_CRI_F2F','IPV','F2F CRI',' '),
    ('F2F_CRI_START','IPV_CRI_F2F','IPV','F2F CRI',' '),
    ('F2F_CRI_VC_ISSUED','IPV_CRI_F2F','IPV','F2F CRI',' '),
    ('F2F_YOTI_PDF_EMAILED','IPV_CRI_F2F','IPV','F2F CRI',' '),
    ('F2F_YOTI_START','IPV_CRI_F2F','IPV','F2F CRI',' '),
    ('IPR_RESULT_NOTIFICATION_EMAILED','IPV_CRI_F2F','IPV','F2F CRI',' '),
    ('IPR_USER_REDIRECTED','IPV_CRI_F2F','IPV','F2F CRI',' '),
    ('IPV_F2F_CRI_VC_CONSUMED','IPV_CRI_F2F','IPV','F2F CRI',' '),
    ('IPV_F2F_CRI_VC_RECEIVED','IPV_CRI_F2F','IPV','F2F CRI',' '),
    ('F2F_YOTI_RESPONSE_RECEIVED','IPV_CRI_F2F','IPV','F2F CRI',' '),
    ('IPV_IDENTITY_ISSUED','IPV_JOURNEY','IPV','IPV Journey',' ');


    --
    TRUNCATE conformed.ref_relying_parties;
    --

INSERT INTO conformed.REF_RELYING_PARTIES(CLIENT_ID,CLIENT_NAME,DISPLAY_NAME) 
    VALUES
('RqFZ83csmS4Mi4Y7s7ohD9-ekwU',	'basic DBS check',	'DBS'),
('XwwVDyl5oJKtK0DVsuw3sICWkPU','Vehicle Operator Licence','DVSA'),
('VsAkrtMBzAosSveAv4xsuUDyiSs',	'Sign your mortgage deed','HMLR'),
('7y-bchtHDfucVR5kcAe8KaM80wg',	'gds-iv-gateway','HMRC'),
('pDqO7_Hu-pq5wam5I4MlURXrv5k',	'Modern Slavery Statement Register','MSU'),
('TGygWFxGDNn8ItyaecWCopqIX3s',	'Subject matter specialists Ofqual','OFQUAL'),
('-1',	'Other','Other'),
('LUIZbIuJ_xVZxwhkNAApcO4O_6o',	'Social Work England','SWE'),
('x3F_Iu0LgqJpegY5ni0QSB0uezw',	'Apprenticeship Service','Apprenticeship-Service'),
('bGAwNKM0XvnxCAuDQ_rMhhP3dxM',	'Claim Criminal Injuries Compensation','CCIC'),
('Y6YaRZ9bjCwS6HxaB34zvRhZJgBQyryT','di-auth-stub-relying-party-production','di-auth-stub-relying-party-production'),
('cAcut5r3PMtoDORZr5b9JT7VPw6VuF3Q','di-auth-stub-relying-party-production-app','di-auth-stub-relying-party-production-app'),
('LcueBVCnGZw-YFdTZ4S07XbQx7I',	'GOV.UK','GOV'),
('OdwbXmA5NLlYmMGHy3kjKFVD3PQ',	'Identity Proving and Verification Return (IPV Return) - Production','IPV'),
('ZL0kvRBP5xMy5OwONj8ARLPyuko',	'lite-exporter','LITE'),
('KcKmx2g1GH6ersWFvzMi1bhehq4',	'production-account-management','production-account-management'),
('MjQc1h7nFVbNM05iawAdkkZ2W89uloDK',	'di-auth-smoketest-microclient-production','SMOKE TEST'),
('zFeCxrwpLCUHFm-C4_CztwWtLfQ',	'Veterans','Veterans'),
('tya4DoMpw_B7FK5YvuMAj3asc0A',	'Find a Grant','GMF');


    raise info 'Setup of conformed layer ran successfully';

EXCEPTION WHEN OTHERS THEN 
    RAISE EXCEPTION'[Error while setting up conformed layer] Exception: %',sqlerrm;

END;

$$ language plpgsql;