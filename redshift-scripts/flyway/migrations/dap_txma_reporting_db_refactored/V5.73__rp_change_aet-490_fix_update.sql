UPDATE conformed_refactored.ref_relying_parties_refactored
SET client_id='38APDWZsRb_ekaVJ3-0WUx1q4AU'
WHERE client_id = 'z9MikRghbhHBwzXYH7i7z8RL0Pk';


UPDATE conformed_refactored.dim_relying_party_refactored
SET client_id='38APDWZsRb_ekaVJ3-0WUx1q4AU',
modified_date=CURRENT_DATE
WHERE client_id = 'z9MikRghbhHBwzXYH7i7z8RL0Pk';


UPDATE conformed_refactored.dim_relying_party_refactored
SET relying_party_name = 'People on Probation',
    display_name      = 'MOJ - People on Probation',
    department_name   = 'MOJ',
    agency_name       = 'MOJ'
WHERE client_id = '38APDWZsRb_ekaVJ3-0WUx1q4AU';