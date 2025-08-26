--DBT - Product Safety Database

INSERT INTO conformed_refactored.REF_RELYING_PARTIES_refactored(CLIENT_ID,CLIENT_NAME,DISPLAY_NAME,department_name,agency_name) 
    VALUES
('sdlgbEirK30fvgbrf0C78XY60qN',	'PDP Connection Portal','MaPS - PDP Connection Portal','DWP','MaPS')
WHERE NOT EXISTS (
    SELECT 1
    FROM conformed_refactored.REF_RELYING_PARTIES_refactored
    WHERE client_id = 'sdlgbEirK30fvgbrf0C78XY60qN'
);



UPDATE conformed_refactored.dim_relying_party_refactored
SET relying_party_name='PDP Connection Portal'
    ,display_name='MaPS - PDP Connection Portal'
    ,department_name='DWP'
    ,agency_name='MaPS'
WHERE  client_id='sdlgbEirK30fvgbrf0C78XY60qN';

--DESNZ - Manage your Energy Savings Opportunity Scheme

INSERT INTO conformed_refactored.REF_RELYING_PARTIES_refactored(CLIENT_ID,CLIENT_NAME,DISPLAY_NAME,department_name,agency_name) 
    VALUES
('zNRRx57bVhTdAZQEMa9Q0lXRb5o',	'Manage your Energy Savings Opportunity Scheme','DESNZ - Manage your Energy Savings Opportunity Scheme','DESNZ','DESNZ')
WHERE NOT EXISTS (
    SELECT 1
    FROM conformed_refactored.REF_RELYING_PARTIES_refactored
    WHERE client_id = 'zNRRx57bVhTdAZQEMa9Q0lXRb5o'
);


UPDATE conformed_refactored.dim_relying_party_refactored
SET relying_party_name='Manage your Energy Savings Opportunity Scheme'
    ,display_name='DESNZ - Manage your Energy Savings Opportunity Scheme'
    ,department_name='DESNZ'
    ,agency_name='DESNZ'
WHERE  client_id='zNRRx57bVhTdAZQEMa9Q0lXRb5o';

--HMCTS - Apply for a Gender Recognition Certificate

INSERT INTO conformed_refactored.REF_RELYING_PARTIES_refactored(CLIENT_ID,CLIENT_NAME,DISPLAY_NAME,department_name,agency_name) 
    VALUES
('PIS7mbqOcs7auNqL2v33aZqESBs',	'FApply for a Gender Recognition Certificate','HMCTS - Apply for a Gender Recognition Certificate','HMCTS','DTS')
WHERE NOT EXISTS (
    SELECT 1
    FROM conformed_refactored.REF_RELYING_PARTIES_refactored
    WHERE client_id = 'PIS7mbqOcs7auNqL2v33aZqESBs'
);


UPDATE conformed_refactored.dim_relying_party_refactored
SET relying_party_name='Apply for a Gender Recognition Certificate'
    ,display_name='HMCTS - Apply for a Gender Recognition Certificate'
    ,department_name='HMCTS'
    ,agency_name='DTS'
WHERE  client_id='PIS7mbqOcs7auNqL2v33aZqESBs';

--IBCA - Infected Blood Compensation Authority

INSERT INTO conformed_refactored.REF_RELYING_PARTIES_refactored(CLIENT_ID,CLIENT_NAME,DISPLAY_NAME,department_name,agency_name) 
    VALUES
('yLjuwmORz6y3V_q26uubltbgzYk',	'Infected Blood Compensation Authority','IBCA - Infected Blood Compensation Authority','HO','IBCA')
WHERE NOT EXISTS (
    SELECT 1
    FROM conformed_refactored.REF_RELYING_PARTIES_refactored
    WHERE client_id = 'yLjuwmORz6y3V_q26uubltbgzYk'
);


UPDATE conformed_refactored.dim_relying_party_refactored
SET relying_party_name='Infected Blood Compensation Authority'
    ,display_name='IBCA - Infected Blood Compensation Authority'
    ,department_name='HO'
    ,agency_name='IBCA'
WHERE  client_id='yLjuwmORz6y3V_q26uubltbgzYk';

--HO - Submit a Pleasure Craft Report

INSERT INTO conformed_refactored.REF_RELYING_PARTIES_refactored(CLIENT_ID,CLIENT_NAME,DISPLAY_NAME,department_name,agency_name) 
    VALUES
('0b_nE_5NWIPUMyTgpniDrXRJL3k',	'Submit a Pleasure Craft Report','HO - Submit a Pleasure Craft Report','HO','HO')
WHERE NOT EXISTS (
    SELECT 1
    FROM conformed_refactored.REF_RELYING_PARTIES_refactored
    WHERE client_id = '0b_nE_5NWIPUMyTgpniDrXRJL3k'
);


UPDATE conformed_refactored.dim_relying_party_refactored
SET relying_party_name='Submit a Pleasure Craft Report'
    ,display_name='HO - Submit a Pleasure Craft Report'
    ,department_name='HO'
    ,agency_name='HO'
WHERE  client_id='0b_nE_5NWIPUMyTgpniDrXRJL3k';

--MHCLG - Private Rented Sector Database

INSERT INTO conformed_refactored.REF_RELYING_PARTIES_refactored(CLIENT_ID,CLIENT_NAME,DISPLAY_NAME,department_name,agency_name) 
    VALUES
('a18vxcxUbW9kNaOSt0t-zEx5U6o',	'Private Rented Sector Database','MHCLG - Private Rented Sector Database','DLUHC','MHCLG')
WHERE NOT EXISTS (
    SELECT 1
    FROM conformed_refactored.REF_RELYING_PARTIES_refactored
    WHERE client_id = 'a18vxcxUbW9kNaOSt0t-zEx5U6o'
);


UPDATE conformed_refactored.dim_relying_party_refactored
SET relying_party_name='Private Rented Sector Database'
    ,display_name='MHCLG - Private Rented Sector Database'
    ,department_name='DLUHC'
    ,agency_name='MHCLG'
WHERE  client_id='a18vxcxUbW9kNaOSt0t-zEx5U6o';