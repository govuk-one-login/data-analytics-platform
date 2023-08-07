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

    raise info 'Setup of conformed layer ran successfully';

EXCEPTION WHEN OTHERS THEN 
    RAISE EXCEPTION'[Error while setting up conformed layer] Exception: %',sqlerrm;

END;

$$ language plpgsql;