--Driver and Vehicle Account

INSERT INTO conformed_refactored.REF_RELYING_PARTIES_refactored(CLIENT_ID,CLIENT_NAME,DISPLAY_NAME,department_name,agency_name) 
    VALUES
('HPAUPxK87FyljocDdQxijxdti08','Driver and Vehicles Account','DVLA - Driver and Vehicles Account','DVLA','DVLA');


UPDATE conformed_refactored.dim_relying_party_refactored
SET relying_party_name='Driver and Vehicles Account'
    ,display_name='DVLA - Driver and Vehicles Account'
    ,department_name='DVLA'
    ,agency_name='DVLA'
WHERE  client_id='HPAUPxK87FyljocDdQxijxdti08';


--Childcare Offer for Wales

INSERT INTO conformed_refactored.REF_RELYING_PARTIES_refactored(CLIENT_ID,CLIENT_NAME,DISPLAY_NAME,department_name,agency_name) 
    VALUES
('zxpIi7Wg-Opj9nSIluDLIwMP3V0','Childcare Offer for Wales','WG - Childcare Offer for Wales','WG','WG');


UPDATE conformed_refactored.dim_relying_party_refactored
SET relying_party_name='Childcare Offer for Wales'
    ,display_name='WG - Childcare Offer for Wales'
    ,department_name='WG'
    ,agency_name='WG'
WHERE  client_id='zxpIi7Wg-Opj9nSIluDLIwMP3V0';


--Submit a Barring Referral

INSERT INTO conformed_refactored.REF_RELYING_PARTIES_refactored(CLIENT_ID,CLIENT_NAME,DISPLAY_NAME,department_name,agency_name) 
    VALUES
('bzy7BV0jTuApvQC9E4xw7b2gAIw','Submit a Barring Referral','DBS - Submit a Barring Referral','HO','DBS');


UPDATE conformed_refactored.dim_relying_party_refactored
SET relying_party_name='Submit a Barring Referral'
    ,display_name='DBS - Submit a Barring Referral'
    ,department_name='HO'
    ,agency_name='DBS'
WHERE  client_id='bzy7BV0jTuApvQC9E4xw7b2gAIw';


--Content AI Store

INSERT INTO conformed_refactored.REF_RELYING_PARTIES_refactored(CLIENT_ID,CLIENT_NAME,DISPLAY_NAME,department_name,agency_name) 
    VALUES
('gKJ2YINNmukQJV3C00-vXvZiAwM','Content AI Store','DFE - Content AI Store','DFE','DFE');


UPDATE conformed_refactored.dim_relying_party_refactored
SET relying_party_name='Content AI Store'
    ,display_name='DFE - Content AI Store'
    ,department_name='DFE'
    ,agency_name='DFE'
WHERE  client_id='gKJ2YINNmukQJV3C00-vXvZiAwM';

--One Login Account Home 

UPDATE conformed_refactored.REF_RELYING_PARTIES_refactored
SET  display_name='One Login Account Home'
    ,agency_name='One Login Account Home'
WHERE  client_id='KcKmx2g1GH6ersWFvzMi1bhehq4';

UPDATE conformed_refactored.dim_relying_party_refactored
SET  display_name='One Login Account Home'
    ,agency_name='One Login Account Home'
WHERE  client_id='KcKmx2g1GH6ersWFvzMi1bhehq4';