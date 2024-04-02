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
    ('IPV_IDENTITY_ISSUED','IPV_JOURNEY','IPV','IPV Journey',' '),
    ('DCMAW_SESSION_RECOVERED','DCMAW_CRI','DCMAW','App Journey',' '),
    ('IPV_DL_CRI_END','IPV_CRI_DRIVING_LICENSE','IPV','Driving License',' '),
    ('IPV_DL_CRI_REQUEST_SENT','IPV_CRI_DRIVING_LICENSE','IPV','Driving License',' '),
    ('IPV_DL_CRI_RESPONSE_RECEIVED','IPV_CRI_DRIVING_LICENSE','IPV','Driving License',' '),
    ('IPV_FRAUD_CRI_END','IPV_CRI_FRAUD','IPV','Fraud CRI',' '),
    ('IPV_KBV_CRI_END','IPV_CRI_KBV','IPV','KBV CRI',' '),
    ('IPV_KBV_CRI_REQUEST_SENT','IPV_CRI_KBV','IPV','KBV CRI',' '),
    ('IPV_KBV_CRI_RESPONSE_RECEIVED','IPV_CRI_KBV','IPV','KBV CRI',' '),
    ('IPV_PASSPORT_CRI_END','IPV_CRI_PASSPORT','IPV','Passport CRI',' '),
    ('IPV_PASSPORT_CRI_REQUEST_SENT','IPV_CRI_PASSPORT','IPV','Passport CRI',' '),
    ('IPV_PASSPORT_CRI_RESPONSE_RECEIVED','IPV_CRI_PASSPORT','IPV','Passport CRI',' '),
    ('DCMAW_ABORT_APP','DCMAW_CRI','DCMAW','App Journey',' '),
    ('DCMAW_ABORT_WEB','DCMAW_CRI','DCMAW','App Journey',' '),
    ('DCMAW_CRI_4XXERROR','DCMAW_CRI','DCMAW','CRI',' '),
    ('DCMAW_CRI_5XXERROR','DCMAW_CRI','DCMAW','CRI',' '),
    ('DCMAW_CRI_END','DCMAW_CRI','DCMAW','CRI',' '),
    ('DCMAW_HYBRID_BILLING_STARTED','DCMAW_CRI','DCMAW','CRI',' '),
    ('DCMAW_IPROOV_BILLING_STARTED','DCMAW_CRI','DCMAW','CRI',' '),
    ('DCMAW_MISSING_CONTEXT_AFTER_ABORT','DCMAW_CRI','DCMAW','App Journey',' '),
    ('DCMAW_MISSING_CONTEXT_AFTER_COMPLETION','DCMAW_CRI','DCMAW','App Journey',' '),
    ('DCMAW_READID_NFC_BILLING_STARTED','DCMAW_CRI','DCMAW','CRI',' '),
    ('DCMAW_REDIRECT_ABORT','DCMAW_CRI','DCMAW','App Journey',' '),
    ('DCMAW_REDIRECT_SUCCESS','DCMAW_CRI','DCMAW','App Journey',' '),
    ('IPV_CORE_CRI_RESOURCE_RETRIEVED','IPV_JOURNEY','IPV','IPV Journey',' '),
    ('IPV_CRI_AUTH_RESPONSE_RECEIVED','IPV_JOURNEY','IPV','Contra-Indicator',' '),
    ('IPV_DELETE_USER_DATA','IPV_JOURNEY','IPV','IPV Journey',' '),
    ('IPV_GPG45_PROFILE_MATCHED','IPV_JOURNEY','IPV','IPV Journey',' '),
    ('IPV_REDIRECT_TO_CRI','IPV_JOURNEY','IPV','IPV Journey',' '),
    ('IPV_SPOT_REQUEST_RECEIVED','IPV_JOURNEY','IPV','IPV Journey','SPOT'),
    ('IPV_SPOT_REQUEST_VALIDATION_FAILURE','IPV_JOURNEY','IPV','SPOT',' '),
    ('IPV_VC_RECEIVED','IPV_JOURNEY','IPV','IPV Journey',' '),
    ('AUTH_DOC_APP_AUTHORISATION_REQUESTED','AUTH_ORCHESTRATION','Authentication','Relying Parties Connect',' '),
    ('IPV_MITIGATION_START','IPV_JOURNEY','IPV','Contra-Indicator',' '),
    ('AUTH_AUTHENTICATION_COMPLETE','AUTH_ACCOUNT_USER_LOGIN','Authentication','User Login',' '),
    ('AUTH_PASSWORD_RESET_REQUESTED','AUTH_ACCOUNT_MANAGEMENT','Authentication','Account Management',' '),
    ('HOME_REPORT_SUSPICIOUS_ACTIVITY','AUTH_ACCOUNT_MANAGEMENT','Authentication','Account Management',' ');


    --
    TRUNCATE conformed.ref_relying_parties;
    --

INSERT INTO conformed.REF_RELYING_PARTIES(CLIENT_ID,CLIENT_NAME,DISPLAY_NAME) 
    VALUES
('RqFZ83csmS4Mi4Y7s7ohD9-ekwU',	'Basic Digital Service','DBS - Basic Digital Service'),
('XwwVDyl5oJKtK0DVsuw3sICWkPU','Vehicle Operator Licence','DVSA - Vehicle Operator Licence'),
('VsAkrtMBzAosSveAv4xsuUDyiSs',	'Sign Your Mortgage Deed','HMLR - Sign Your Mortgage Deed'),
('7y-bchtHDfucVR5kcAe8KaM80wg',	'Government Gateway','HMRC - Government Gateway'),
('pDqO7_Hu-pq5wam5I4MlURXrv5k',	'Modern Slavery Statement Register','MSU - Modern Slavery Statement Register'),
('TGygWFxGDNn8ItyaecWCopqIX3s',	'Subject Matter Specialist','Ofqual - Subject Matter Specialist'),
('-1',	'Other','Other - Other'),
('LUIZbIuJ_xVZxwhkNAApcO4O_6o',	'Social Worker Register','SWE - Social Worker Register'),
('x3F_Iu0LgqJpegY5ni0QSB0uezw',	'Apprenticeship Service','NAS - Apprenticeship Service'),
('bGAwNKM0XvnxCAuDQ_rMhhP3dxM',	'Claim Criminal Injuries Compensation (CCIC)','CICA - Claim Criminal Injuries Compensation'),
('Y6YaRZ9bjCwS6HxaB34zvRhZJgBQyryT','di-auth-stub-relying-party-production','di-auth-stub - di-auth-stub-relying-party-production'),
('cAcut5r3PMtoDORZr5b9JT7VPw6VuF3Q','di-auth-stub-relying-party-production-app','di-auth-stub - di-auth-stub-relying-party-production-app'),
('LcueBVCnGZw-YFdTZ4S07XbQx7I',	'GOV.UK','GOV - GOV.UK'),
('OdwbXmA5NLlYmMGHy3kjKFVD3PQ',	'Identity Proving and Verification Return (IPV Return) - Production','IPV - Identity Proving and Verification Return - Production'),
('ZL0kvRBP5xMy5OwONj8ARLPyuko',	'Licensing for International Trade and Enterprise','DBT - Licensing for International Trade and Enterprise (LITE)'),
('KcKmx2g1GH6ersWFvzMi1bhehq4',	'production-account-management','production-account-management - production-account-management'),
('MjQc1h7nFVbNM05iawAdkkZ2W89uloDK','di-auth-smoketest-microclient-production','SMOKE TEST - di-auth-smoketest-microclient-production'),
('zFeCxrwpLCUHFm-C4_CztwWtLfQ',	'Veterans Identity Card','Veterans - Veterans Identity Card'),
('tya4DoMpw_B7FK5YvuMAj3asc0A',	'Find and Apply for a Grant','GMF - Find and Apply for a Grant'),
('9fduJ6KAE8WwCb1VCKp788BC8mM',	'UK Market Conformity Assessment Bodies (UKMCAB)','OPSS - UK Market Conformity Assessment Bodies'),
('zbNToJPcre4BXEap0na8kOjniKg',	'Manage Family Hubs','DFE - Manage Family Hubs'),
('FakIq5aYsHQ02dBOc6XwyA1wRRs',	'Great British Insulation Scheme (GBIS)','Ofgem - Great British Insulation Scheme (GBIS)'),
('2nAxHa72OqhE6eKymHZIx-sV3vI',	'Apprenticeship provider and assessment register service','NAS - Apprenticeship Provider and Assessment Register Service'),
('MJ8nBsh32LHweUjb6x3p7qf-_TE',	'Apprenticeship assessment service','NAS - Apprenticeship Assessment Service'),
('txsGLvMYYCPaWPZRq2L7XxEnyro',	'Early Years Child Development Training','DFE - Early Years Child Development Training'),
('mQDXGO7gWdK7V28v82nVcEGuacY',	'HMRC','HMRC - HMRC'),
('DVUDWXsy0io7wDBH5LA5IEkEH5U',	'Plan Your Future','PYF - Plan Your Future');


    raise info 'Setup of conformed layer ran successfully';

EXCEPTION WHEN OTHERS THEN 
    RAISE EXCEPTION'[Error while setting up conformed layer] Exception: %',sqlerrm;

END;

$$ language plpgsql;