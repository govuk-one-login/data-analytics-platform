    UPDATE  conformed.fact_user_journey_event
    SET
       check_details_kbv_response_mode=st.check_details_kbv_response_mode 
          ,MODIFIED_BY=current_user
      ,MODIFIED_DATE=CURRENT_DATE
    FROM (select product_family,
    event_id,
    trim(CASE when JSON_SERIALIZE(CHECK_DETAILS_KBV_RESPONSE_MODE)='null'
                                        then NULL
                                        ELSE
                                            JSON_SERIALIZE(CHECK_DETAILS_KBV_RESPONSE_MODE) 
                                        END ,'"') CHECK_DETAILS_KBV_RESPONSE_MODE
FROM 
(select
    DISTINCT Auth.product_family,
    Auth.event_id,
     checkdetails_kbvresponsemode CHECK_DETAILS_KBV_RESPONSE_MODE
from
    (
        select
            *
        from
            (
                SELECT
                    'ipv_journey' Product_family,
                    row_number() over (
                        partition by event_id,
                        timestamp_formatted
                        order by
                            processed_date desc,
                            cast (day as integer) desc
                    ) as row_num,
                    *
                FROM
                    (
                        with base_data as (
                            SELECT
                                event_id,
                                event_name,
                                extensions_evidence,
                                "timestamp",
                                timestamp_formatted,
                                month,
                                day,
                                year,
                                processed_date,
                                nvl2(
                                    valid_json_data,
                                    valid_json_data.checkdetails,
                                    valid_json_data
                                ) AS checkdetails
                                
                            FROM
                                (
                                    SELECT
                                        event_id,
                                        event_name,
                                        "timestamp",
                                timestamp_formatted,
                                month,
                                day,
                                year,
                                processed_date,
                                        extensions_evidence,
                                        case extensions_evidence != ''
                                        and is_valid_json_array(extensions_evidence)
                                        when true then json_parse(
                                            json_extract_array_element_text(extensions_evidence, 0)
                                        )
                                        else null end as valid_json_data

                                    FROM
                                        "dap_txma_reporting_db"."dap_txma_stage"."ipv_journey" 
                                )
                        ),
                        level_1_data as (
                            SELECT
                                event_id,
                                event_name,
                                "timestamp",
                                timestamp_formatted,
                                month,
                                day,
                                year,
                                processed_date,
                                extensions_evidence, 
                                --extensions_experianiiqresponse,
                                json_serialize(checkdetails) checkdetails_final
                            FROM
                                base_data
                            where
                                json_serialize(checkdetails) != ''
                        ),
                        level_2_data as (
                            select
                                event_id,
                                event_name,
                                "timestamp",
                                timestamp_formatted,
                                year,
                                month,
                                day,
                                processed_date,
                                extensions_evidence,
                                case checkdetails_final != ''
                                and is_valid_json_array(checkdetails_final)
                                when true then json_parse(
                                    json_extract_array_element_text(checkdetails_final, 0)
                                )
                                else null end as valid_json_checkdetails_data
                            from
                                level_1_data
                        )
                        select
                            event_id,
                            event_name,
                            "timestamp",
                            timestamp_formatted,
                             year,
                            month,
                            day,
                            processed_date,
                            nvl2(
                                valid_json_checkdetails_data,
                                valid_json_checkdetails_data.kbvresponsemode,
                                valid_json_checkdetails_data
                            ) AS checkdetails_kbvresponsemode
                        from
                            level_2_data
                    )
            )
        where
            row_num = 1
    ) Auth
    join conformed.BatchControl BatC On Auth.Product_family = BatC.Product_family
    join conformed.REF_EVENTS ref on Auth.EVENT_NAME = ref.event_name
  ) )AS st
    WHERE fact_user_journey_event.event_id = st.event_id ;  