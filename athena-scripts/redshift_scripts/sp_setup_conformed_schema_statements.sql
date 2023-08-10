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
    ('DCMAW_WEB_END','DCMAW_CRI','DCMAW','APP Journey',' '),
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
    ('IPV_SPOT_RESPONSE_REJECTED','IPV_JOURNEY','IPV','IPV Journey','SPOT');


    --
    TRUNCATE conformed.ref_relying_parties;
    --
    INSERT INTO conformed.REF_RELYING_PARTIES(CLIENT_ID,CLIENT_NAME,DESCRIPTION) 
    VALUES
    ('LcueBVCnGZw-YFdTZ4S07XbQx7I','GOV.UK','auth'),
    ('ZL0kvRBP5xMy5OwONj8ARLPyuko','lite-exporter','auth'),
    ('TGygWFxGDNn8ItyaecWCopqIX3s','Subject matter specialists Ofqual','auth'),
    ('pDqO7_Hu-pq5wam5I4MlURXrv5k','Modern Slavery Statement Register','auth'),
    ('x3F_Iu0LgqJpegY5ni0QSB0uezw','Apprenticeship Service','auth'),
    ('zbNToJPcre4BXEap0na8kOjniKg','Manage family and support services','auth'),
    ('RqFZ83csmS4Mi4Y7s7ohD9-ekwU','basic DBS check','auth+id'),
    ('LUIZbIuJ_xVZxwhkNAApcO4O_6o','Social Work England','auth+id'),
    ('VsAkrtMBzAosSveAv4xsuUDyiSs','Sign your mortgage deed','auth+id'),
    ('XwwVDyl5oJKtK0DVsuw3sICWkPU','Vehicle Operator Licence','auth+id'),
    ('zFeCxrwpLCUHFm-C4_CztwWtLfQ','Apply for a HM Armed Forces Veteran Card','auth+id'),
    ('OdwbXmA5NLlYmMGHy3kjKFVD3PQ','Identity Proving and Verification Return (IPV Return) - Production','F2F email'),
    ('7y-bchtHDfucVR5kcAe8KaM80wg','gov_gateway','app only'),
    ('eTsLzrBkyI50bZOF6HlGvGEYKNYTTVWc','GOV.UK_Sign_In_Account_Management (old)','One Login'),
    ('KcKmx2g1GH6ersWFvzMi1bhehq4','production-account-management','One Login'),
    ('cAcut5r3PMtoDORZr5b9JT7VPw6VuF3Q','di-auth-stub-relying-party-production-app','ignore'),
    ('Y6YaRZ9bjCwS6HxaB34zvRhZJgBQyryT','di-auth-stub-relying-party-production','ignore'),
    ('MjQc1h7nFVbNM05iawAdkkZ2W89uloDK','di-auth-smoketest-microclient-production','ignore');


    raise info 'Setup of conformed layer ran successfully';

EXCEPTION WHEN OTHERS THEN 
    RAISE EXCEPTION'[Error while setting up conformed layer] Exception: %',sqlerrm;

END;

$$ language plpgsql;