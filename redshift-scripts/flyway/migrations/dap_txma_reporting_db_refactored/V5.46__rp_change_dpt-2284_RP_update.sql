update conformed_refactored."ref_relying_parties_refactored"
set client_name='Teacher Success',display_name='DFE - Teacher Success'
where client_id='vjp-5BDhot33nZ2TmZMmLNrCxhE' ;


update conformed_refactored.dim_relying_party_refactored
set relying_party_name='Teacher Success',display_name='DFE - Teacher Success',
modified_date=CURRENT_DATE
where client_id='vjp-5BDhot33nZ2TmZMmLNrCxhE' ;