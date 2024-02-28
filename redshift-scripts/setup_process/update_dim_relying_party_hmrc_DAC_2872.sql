UPDATE conformed_refactored.dim_relying_party_refactored AS dim
SET relying_party_name=ref.client_name
    ,display_name=ref.display_name
FROM conformed_refactored.ref_relying_parties_refactored AS ref
WHERE dim.client_id = ref.client_id
and ref.client_id='mQDXGO7gWdK7V28v82nVcEGuacY';