update "conformed_refactored"."ref_relying_parties_refactored"
set client_id='-REiRoFh0lDHTgZd7j-ecAjPrMw'
where client_id='REiRoFh0lDHTgZd7j-ecAjPrMw';


update "conformed_refactored"."dim_relying_party_refactored"
set client_id='-REiRoFh0lDHTgZd7j-ecAjPrMw',
relying_party_name='Private Rented Sector Exemptions Register',
display_name='DESNZ - Private Rented Sector Exemptions Register',
department_name='DESNZ',
agency_name='DESNZ',
modified_date=current_date
where client_id='REiRoFh0lDHTgZd7j-ecAjPrMw'; 