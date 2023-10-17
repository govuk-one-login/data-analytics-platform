--AUTH_ACCOUNT_USER_LOGIN
INSERT INTO conformed.REF_EVENTS VALUES('AUTH_AUTH_CODE_ISSUED','AUTH_ACCOUNT_USER_LOGIN','Authentication','User Login','SPOT');

--AUTH_ORCHESTRATION
INSERT INTO conformed.REF_EVENTS VALUES('AUTH_AUTHORISATION_REQUEST_ERROR','AUTH_ORCHESTRATION','Authentication','User Login',' ');
INSERT INTO conformed.REF_EVENTS VALUES('AUTH_AUTHORISATION_REQUEST_RECEIVED','AUTH_ORCHESTRATION','Authentication','Relying Parties Connect',' ');
INSERT INTO conformed.REF_EVENTS VALUES('AUTH_IPV_AUTHORISATION_REQUESTED','AUTH_ORCHESTRATION','Authentication','Relying Parties Connect',' ');

--IPV_CRI_ADDRESS
INSERT INTO conformed.REF_EVENTS VALUES('IPV_ADDRESS_CRI_END','IPV_CRI_ADDRESS','IPV','Address CRI',' ');
INSERT INTO conformed.REF_EVENTS VALUES('IPV_ADDRESS_CRI_REQUEST_SENT','IPV_CRI_ADDRESS','IPV','Address CRI',' ');




--IPV_CRI_FRAUD
INSERT INTO conformed.REF_EVENTS VALUES('IPV_FRAUD_CRI_REQUEST_SENT','IPV_CRI_FRAUD','IPV','Fraud CRI',' ');
INSERT INTO conformed.REF_EVENTS VALUES('IPV_FRAUD_CRI_RESPONSE_RECEIVED','IPV_CRI_FRAUD','IPV','Fraud CRI',' ');
INSERT INTO conformed.REF_EVENTS VALUES('IPV_FRAUD_CRI_THIRD_PARTY_REQUEST_ENDED','IPV_CRI_FRAUD','IPV','Fraud CRI',' ');


--IPV_CRI_CIC
INSERT INTO conformed.REF_EVENTS VALUES('CIC_CRI_AUTH_CODE_ISSUED','IPV_CRI_CIC','IPV','CIC CRI',' ');
INSERT INTO conformed.REF_EVENTS VALUES('CIC_CRI_START','IPV_CRI_CIC','IPV','CIC CRI',' ');
INSERT INTO conformed.REF_EVENTS VALUES('CIC_CRI_VC_ISSUED','IPV_CRI_CIC','IPV','CIC CRI',' ');


--F2F CRI
INSERT INTO conformed.REF_EVENTS VALUES('F2F_CRI_AUTH_CODE_ISSUED','IPV_CRI_F2F','IPV','F2F CRI',' ');
INSERT INTO conformed.REF_EVENTS VALUES('F2F_CRI_START','IPV_CRI_F2F','IPV','F2F CRI',' ');
INSERT INTO conformed.REF_EVENTS VALUES('F2F_CRI_VC_ISSUED','IPV_CRI_F2F','IPV','F2F CRI',' ');
INSERT INTO conformed.REF_EVENTS VALUES('F2F_YOTI_PDF_EMAILED','IPV_CRI_F2F','IPV','F2F CRI',' ');
INSERT INTO conformed.REF_EVENTS VALUES('F2F_YOTI_START','IPV_CRI_F2F','IPV','F2F CRI',' ');
INSERT INTO conformed.REF_EVENTS VALUES('IPR_RESULT_NOTIFICATION_EMAILED','IPV_CRI_F2F','IPV','F2F CRI',' ');
INSERT INTO conformed.REF_EVENTS VALUES('IPR_USER_REDIRECTED','IPV_CRI_F2F','IPV','F2F CRI',' ');
INSERT INTO conformed.REF_EVENTS VALUES('IPV_F2F_CRI_VC_CONSUMED','IPV_CRI_F2F','IPV','F2F CRI',' ');
INSERT INTO conformed.REF_EVENTS VALUES('IPV_F2F_CRI_VC_RECEIVED','IPV_CRI_F2F','IPV','F2F CRI',' ');
INSERT INTO conformed.REF_EVENTS VALUES('F2F_YOTI_RESPONSE_RECEIVED','IPV_CRI_F2F','IPV','F2F CRI',' ');
