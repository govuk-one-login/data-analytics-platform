CREATE OR REPLACE PROCEDURE conformed.sp_conformed_data_objects() 
AS $$ 
BEGIN 


    CREATE TABLE conformed.BatchControl (
      Product_family varchar(100),
      MaxRunDate DATETIME
    );
    --

    insert into conformed.BatchControl (Product_family,MaxRunDate)
    values 
    ('auth_account_creation','1999-01-01 00:00:00'),
    ('auth_orchestration','1999-01-01 00:00:00'), 
    ('auth_account_user_login','1999-01-01 00:00:00'), 
    ('dcmaw_cri','1999-01-01 00:00:00'), 
    ('auth_account_mfa','1999-01-01 00:00:00'), 
    ('auth_account_management','1999-01-01 00:00:00'),  
    ('ipv_cri_address','1999-01-01 00:00:00'), 
    ('ipv_cri_driving_license','1999-01-01 00:00:00'),
    ('ipv_cri_fraud','1999-01-01 00:00:00'),
    ('ipv_journey','1999-01-01 00:00:00'),
    ('ipv_cri_kbv','1999-01-01 00:00:00'),
    ('ipv_cri_passport','1999-01-01 00:00:00');


    --
    CREATE TABLE conformed.DIM_EVENT (
    EVENT_KEY INT IDENTITY(1,1),
    EVENT_NAME VARCHAR(500),
    PRODUCT_FAMILY VARCHAR(1000),
    EVENT_DESCRIPTION VARCHAR(500),
    EVENT_JOURNEY_TYPE VARCHAR(100),
    SERVICE_NAME VARCHAR(100),
    CREATED_BY VARCHAR(100),
    CREATED_DATE DATE,
    MODIFIED_BY VARCHAR(100),
    MODIFIED_DATE DATE,
    BATCH_ID INTEGER,
    PRIMARY KEY (EVENT_KEY)
    ) ;

    CREATE TABLE conformed.DIM_DATE (
    DATE_KEY INT ,
    DATE DATE ,
    DAY VARCHAR(50),
    DAY_SUFFIX VARCHAR(50),
    WEEKDAY VARCHAR(50),
    WEEKDAY_NAME VARCHAR(50),
    WEEKDAY_NAME_SHORT VARCHAR(10),
    DAY_OF_WEEK_IN_MONTH VARCHAR(50),
    DAY_OF_YEAR VARCHAR(10),
    WEEK_OF_YEAR VARCHAR(10),
    MONTH VARCHAR(50),
    MONTH_NAME VARCHAR(50),
    MONTH_NAME_SHORT VARCHAR(10),
    QUARTER VARCHAR(50),
    QUARTER_NAME VARCHAR(50),
    YEAR VARCHAR(10),
    IS_WEEKEND CHAR(1),
    CREATED_BY VARCHAR(100),
    CREATED_DATE DATE,
    MODIFIED_BY VARCHAR(100),
    MODIFIED_DATE DATE,
    BATCH_ID INTEGER,
    PRIMARY KEY (DATE_KEY)
    );


    CREATE TABLE conformed.DIM_JOURNEY_CHANNEL(
    JOURNEY_CHANNEL_KEY INT IDENTITY (1,1),
    CHANNEL_NAME VARCHAR(100),
    CHANNEL_DESCRIPTION VARCHAR(100),
    CREATED_BY VARCHAR(100),
    CREATED_DATE DATE,
    MODIFIED_BY VARCHAR(100),
    MODIFIED_DATE DATE,
    BATCH_ID INTEGER,
    PRIMARY KEY (JOURNEY_CHANNEL_KEY)
    );


    CREATE TABLE conformed.DIM_RELYING_PARTY (
    RELYING_PARTY_KEY INT IDENTITY (1,1),
    CLIENT_ID VARCHAR(1000),
    RELYING_PARTY_NAME VARCHAR(1000),
    DISPLAY_NAME VARCHAR(1000),
    CREATED_BY VARCHAR(100),
    CREATED_DATE DATE,
    MODIFIED_BY VARCHAR(100),
    MODIFIED_DATE DATE,
    BATCH_ID INTEGER,
    PRIMARY KEY (RELYING_PARTY_KEY)
    );


    CREATE TABLE conformed.DIM_VERIFICATION_ROUTE(
    VERIFICATION_ROUTE_KEY INT IDENTITY(1,1),
    VERIFICATION_ROUTE_NAME VARCHAR(500),
    VERIFICATION_SHORT_NAME VARCHAR(50),
    ROUTE_DESCRIPTION VARCHAR(500),
    CREATED_BY VARCHAR(100),
    CREATED_DATE DATE,
    MODIFIED_BY VARCHAR(100),
    MODIFIED_DATE DATE,
    BATCH_ID INTEGER,
    PRIMARY KEY (VERIFICATION_ROUTE_KEY)
    );


    CREATE TABLE conformed.FACT_USER_JOURNEY_EVENT(
    USER_JOURNEY_EVENT_KEY INT IDENTITY(1,1),
    EVENT_KEY INTEGER NOT NULL ,
    DATE_KEY INTEGER NOT NULL ,
    VERIFICATION_ROUTE_KEY INTEGER NOT NULL ,
    JOURNEY_CHANNEL_KEY INTEGER NOT NULL ,
    RELYING_PARTY_KEY INTEGER NOT NULL ,
    USER_USER_ID VARCHAR(100),
    EVENT_ID VARCHAR(100) UNIQUE,
    EVENT_TIME VARCHAR(1000),
    USER_GOVUK_SIGNIN_JOURNEY_ID VARCHAR(100),
    COMPONENT_ID VARCHAR(100),
    EVENT_COUNT  INTEGER,
    REJECTION_REASON  VARCHAR(1000),
    REASON  VARCHAR(1000),
    NOTIFICATION_TYPE  VARCHAR(1000),
    MFA_TYPE  VARCHAR(1000),
    ACCOUNT_RECOVERY  VARCHAR(1000),
    FAILED_CHECK_DETAILS_BIOMETRIC_VERIFICATION_PROCESS_LEVEL  VARCHAR(50),
    CHECK_DETAILS_BIOMETRIC_VERIFICATION_PROCESS_LEVEL  VARCHAR(50),
    ADDRESSES_ENTERED  VARCHAR(1000),
    ACTIVITY_HISTORY_SCORE  INTEGER,
    IDENTITY_FRAUD_SCORE  INTEGER,
    DECISION_SCORE  INTEGER,
    FAILED_CHECK_DETAILS_KBV_RESPONSE_MODE  VARCHAR(1000),
    FAILED_CHECK_DETAILS_CHECK_METHOD  VARCHAR(1000),
    CHECK_DETAILS_KBV_RESPONSE_MODE  VARCHAR(1000),
    CHECK_DETAILS_KBV_QUALITY  VARCHAR(1000),
    VERIFICATION_SCORE  INTEGER,
    STRENGTH_SCORE INTEGER,
    CHECK_DETAILS_CHECK_METHOD  VARCHAR(1000),
    Iss  VARCHAR(1000),
    EXPERIAN_IIQ_RESPONSE VARCHAR(1000),
    VALIDITY_SCORE   INTEGER,
    TYPE  VARCHAR(1000),
    PROCESSED_DATE VARCHAR(100),
    CREATED_BY VARCHAR(100),
    CREATED_DATE DATE,
    MODIFIED_BY VARCHAR(100),
    MODIFIED_DATE DATE,
    BATCH_ID INTEGER,
        PRIMARY KEY (USER_JOURNEY_EVENT_KEY),
        FOREIGN KEY (EVENT_KEY) REFERENCES conformed.DIM_EVENT (EVENT_KEY),
        FOREIGN KEY (DATE_KEY) REFERENCES conformed.DIM_DATE (DATE_KEY),
        FOREIGN KEY (VERIFICATION_ROUTE_KEY) REFERENCES conformed.DIM_VERIFICATION_ROUTE (VERIFICATION_ROUTE_KEY),
        FOREIGN KEY (JOURNEY_CHANNEL_KEY) REFERENCES conformed.DIM_JOURNEY_CHANNEL (JOURNEY_CHANNEL_KEY),
        FOREIGN KEY (RELYING_PARTY_KEY) REFERENCES conformed.DIM_RELYING_PARTY (RELYING_PARTY_KEY)
    );


    CREATE TABLE conformed.REF_EVENTS (
      EVENT_NAME varchar(1000),
      PRODUCT_FAMILY varchar(1000),
      DOMAIN varchar(1000),
      SUB_DOMAIN varchar(1000),
      OTHER_SUB_DOMAIN VARCHAR(1000)
    );  

    CREATE TABLE conformed.REF_RELYING_PARTIES (
      REF_RELYING_PARTIE_KEY INT IDENTITY(1,1),
      CLIENT_ID varchar(1000),
      CLIENT_NAME varchar(1000), 
      DISPLAY_NAME VARCHAR(1000)
    );


    raise info 'Setup of conformed layer ran successfully';

EXCEPTION WHEN OTHERS THEN 
    RAISE EXCEPTION'[Error while setting up conformed layer] Exception: %',sqlerrm;

END;

$$ language plpgsql;