INSERT INTO conformed_refactored.REF_RELYING_PARTIES_refactored(CLIENT_ID,CLIENT_NAME,DISPLAY_NAME,department_name,agency_name) 
    VALUES
('CCdLjqwGtpAA1Td2CrNHT1yFbqa',	'Find an Apprenticeship','NAS - Find an Apprenticeship','DFE','NAS');


UPDATE conformed_refactored.dim_relying_party_refactored
SET relying_party_name='Find an Apprenticeship'
    ,display_name='NAS - Find an Apprenticeship'
    ,department_name='DFE'
    ,agency_name='NAS'
WHERE  client_id='CCdLjqwGtpAA1Td2CrNHT1yFbqa';


INSERT INTO conformed_refactored.REF_RELYING_PARTIES_refactored(CLIENT_ID,CLIENT_NAME,DISPLAY_NAME,department_name,agency_name) 
    VALUES
('iJNgycwBNEWGQvkuiLxOdVmVzG9',	'Driving with a medical condition','DVLA - Driving with a medical condition','DVLA','DVLA');


UPDATE conformed_refactored.dim_relying_party_refactored
SET relying_party_name='Driving with a medical condition'
    ,display_name='DVLA - Driving with a medical condition'
    ,department_name='DVLA'
    ,agency_name='DVLA'
WHERE  client_id='iJNgycwBNEWGQvkuiLxOdVmVzG9';


INSERT INTO conformed_refactored.REF_RELYING_PARTIES_refactored(CLIENT_ID,CLIENT_NAME,DISPLAY_NAME,department_name,agency_name) 
    VALUES
('jdLmZNsFSD6zgt0MNRpOCsCvfCp',	'Send a Supervising engineer’s annual statement','EA - Send a Supervising engineer’s annual statement','DEFRA','EA');


UPDATE conformed_refactored.dim_relying_party_refactored
SET relying_party_name='Send a Supervising engineer’s annual statement'
    ,display_name='EA - Send a Supervising engineer’s annual statement'
    ,department_name='DEFRA'
    ,agency_name='EA'
WHERE  client_id='jdLmZNsFSD6zgt0MNRpOCsCvfCp';