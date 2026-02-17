--MOD - Home Hub Repairs Portal

INSERT INTO conformed_refactored.REF_RELYING_PARTIES_refactored(CLIENT_ID,CLIENT_NAME,DISPLAY_NAME,department_name,agency_name) 
SELECT '5n048LYRQ4zTlInf7sqxgsYMGyI','Home Hub Repairs Portal','MOD - Home Hub Repairs Portal','MOD','MOD'
WHERE NOT EXISTS (
    SELECT 1
    FROM conformed_refactored.REF_RELYING_PARTIES_refactored
    WHERE client_id = '5n048LYRQ4zTlInf7sqxgsYMGyI'
);

UPDATE conformed_refactored.dim_relying_party_refactored
SET relying_party_name='Home Hub Repairs Portal'
    ,display_name='MOD - Home Hub Repairs Portal'
    ,department_name='MOD'
    ,agency_name='MOD'
WHERE  client_id='5n048LYRQ4zTlInf7sqxgsYMGyI';


--MOD - Home Hub Appointment Web App

INSERT INTO conformed_refactored.REF_RELYING_PARTIES_refactored(CLIENT_ID,CLIENT_NAME,DISPLAY_NAME,department_name,agency_name) 
SELECT 'GQf70-tvgfHyQsdQhJ2-b80wJcs','Home Hub Appointment Web App','MOD - Home Hub Appointment Web App','MOD','MOD'
WHERE NOT EXISTS (
    SELECT 1
    FROM conformed_refactored.REF_RELYING_PARTIES_refactored
    WHERE client_id = 'GQf70-tvgfHyQsdQhJ2-b80wJcs'
);

UPDATE conformed_refactored.dim_relying_party_refactored
SET relying_party_name='Home Hub Appointment Web App'
    ,display_name='MOD - Home Hub Appointment Web App'
    ,department_name='MOD'
    ,agency_name='MOD'
WHERE  client_id='GQf70-tvgfHyQsdQhJ2-b80wJcs';


--DHSC - Plan and Manage Health and Care Research Ticketing

INSERT INTO conformed_refactored.REF_RELYING_PARTIES_refactored(CLIENT_ID,CLIENT_NAME,DISPLAY_NAME,department_name,agency_name) 
SELECT 'IoAdaUybKe-8_sq2AXegO6rSlII','Plan and Manage Health and Care Research Ticketing','DHSC - Plan and Manage Health and Care Research Ticketing','DHSC','DHSC'
WHERE NOT EXISTS (
    SELECT 1
    FROM conformed_refactored.REF_RELYING_PARTIES_refactored
    WHERE client_id = 'IoAdaUybKe-8_sq2AXegO6rSlII'
);

UPDATE conformed_refactored.dim_relying_party_refactored
SET relying_party_name='Plan and Manage Health and Care Research Ticketing'
    ,display_name='DHSC - Plan and Manage Health and Care Research Ticketing'
    ,department_name='DHSC'
    ,agency_name='DHSC'
WHERE  client_id='IoAdaUybKe-8_sq2AXegO6rSlII';


--DHSC - Plan and Manage Health and Care Research Portal

INSERT INTO conformed_refactored.REF_RELYING_PARTIES_refactored(CLIENT_ID,CLIENT_NAME,DISPLAY_NAME,department_name,agency_name) 
SELECT '78jhcClFeoQMdZ_QInarLsuQncQ','Plan and Manage Health and Care Research Portal','DHSC - Plan and Manage Health and Care Research Portal','DHSC','DHSC'
WHERE NOT EXISTS (
    SELECT 1
    FROM conformed_refactored.REF_RELYING_PARTIES_refactored
    WHERE client_id = '78jhcClFeoQMdZ_QInarLsuQncQ'
);

UPDATE conformed_refactored.dim_relying_party_refactored
SET relying_party_name='Plan and Manage Health and Care Research Portal'
    ,display_name='DHSC - Plan and Manage Health and Care Research Portal'
    ,department_name='DHSC'
    ,agency_name='DHSC'
WHERE  client_id='78jhcClFeoQMdZ_QInarLsuQncQ';


--DESNZ - Fuel Finder

INSERT INTO conformed_refactored.REF_RELYING_PARTIES_refactored(CLIENT_ID,CLIENT_NAME,DISPLAY_NAME,department_name,agency_name) 
SELECT 'cIbFPQz3xhXDYJeOr3S7A3tjjjk','Fuel Finder','DESNZ - Fuel Finder','DESNZ','DESNZ'
WHERE NOT EXISTS (
    SELECT 1
    FROM conformed_refactored.REF_RELYING_PARTIES_refactored
    WHERE client_id = 'cIbFPQz3xhXDYJeOr3S7A3tjjjk'
);

UPDATE conformed_refactored.dim_relying_party_refactored
SET relying_party_name='Fuel Finder'
    ,display_name='DESNZ - Fuel Finder'
    ,department_name='DESNZ'
    ,agency_name='DESNZ'
WHERE  client_id='cIbFPQz3xhXDYJeOr3S7A3tjjjk';


--MOD - Apply for or Replace a Medal or Veterans Badge

INSERT INTO conformed_refactored.REF_RELYING_PARTIES_refactored(CLIENT_ID,CLIENT_NAME,DISPLAY_NAME,department_name,agency_name) 
SELECT '4Yq7YU-dsyVC_edOiAZRynuEKKI','Apply for or Replace a Medal or Veterans Badge','MOD - Apply for or Replace a Medal or Veterans Badge','MOD','MOD'
WHERE NOT EXISTS (
    SELECT 1
    FROM conformed_refactored.REF_RELYING_PARTIES_refactored
    WHERE client_id = '4Yq7YU-dsyVC_edOiAZRynuEKKI'
);

UPDATE conformed_refactored.dim_relying_party_refactored
SET relying_party_name='Apply for or Replace a Medal or Veterans Badge'
    ,display_name='MOD - Apply for or Replace a Medal or Veterans Badge'
    ,department_name='MOD'
    ,agency_name='MOD'
WHERE  client_id='4Yq7YU-dsyVC_edOiAZRynuEKKI';