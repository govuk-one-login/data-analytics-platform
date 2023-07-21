CREATE OR replace PROCEDURE conformed.sp_setup_conformed_schema () 
AS $$
BEGIN

	INSERT INTO conformed.batchcontrol (
		product_family,
		maxrundate
		)
	VALUES (
		'auth_account_creation',
		'1999-01-01 00:00:00'
		);

    --

	CREATE OR replace VIEW conformed.v_stg_auth_account_creation AS

        SELECT DISTINCT 
            auth.product_family,
            auth.event_id,
            auth.client_id,
            auth.component_id,
            auth.user_govuk_signin_journey_id,
            auth.user_user_id,
            auth.TIMESTAMP,
            auth.timestamp_formatted,
            auth.processed_date,
            auth.event_name,
            1 event_count,
            NULL rejection_reason,
            NULL reason,
            NULL notification_type,
            NULL mfa_type,
            NULL account_recovery,
            NULL failed_check_details_biometric_verification_process_level,
            NULL check_details_biometric_verification_process_level,
            NULL addresses_entered,
            NULL activity_history_score,
            NULL identity_fraud_score,
            NULL decision_score,
            NULL failed_check_details_kbv_response_mode,
            NULL failed_check_details_check_method,
            NULL check_details_kbv_response_model,
            NULL check_details_kbv_quality,
            NULL verification_score,
            NULL check_details_check_method,
            NULL iss,
            NULL validity_score,
            NULL "type",
            batc.product_family batch_product_family,
            batc.maxrundate,
            ref.product_family ref_product_family,
            ref.domain,
            ref.sub_domain,
            ref.other_sub_domain
        FROM (
            SELECT *
            FROM (
                SELECT 'auth_account_creation' product_family,
                    row_number() OVER (
                        PARTITION BY event_id,
                        timestamp_formatted ORDER BY cast(day AS INTEGER) DESC
                        ) AS row_num,
                    *
                FROM "dap_txma_reporting_db"."dap_txma_stage"."auth_account_creation"
                )
            WHERE row_num = 1
            ) auth
        JOIN conformed.batchcontrol batc ON auth.product_family = batc.product_family
            AND to_date(processed_date, 'yyyymmdd') > nvl(maxrundate, NULL)
        JOIN conformed.ref_events ref ON auth.event_name = ref.event_name
        WITH no SCHEMA binding;

    --

	UPDATE conformed.dim_event
	SET event_name = st.event_name,
		event_description = st.event_name,
		product_family = ref_product_family,
		event_journey_type = st.domain,
		service_name = st.sub_domain,
		modified_by = 'dummy_new',
		modified_date = CURRENT_DATE,
		batch_id = 0000
	FROM (
		SELECT *
		FROM conformed.v_stg_auth_account_creation
		WHERE event_name IN (
				SELECT event_name
				FROM conformed.dim_event
				)
		) AS st
	WHERE dim_event.event_name = st.event_name;

	--

	INSERT INTO conformed.dim_event (
		event_name,
		event_description,
		product_family,
		event_journey_type,
		service_name,
		created_by,
		created_date,
		modified_by,
		modified_date,
		batch_id
		)
	SELECT DISTINCT event_name,
		event_name,
		ref_product_family,
		domain,
		sub_domain,
		'dummy',
		CURRENT_DATE,
		'dummy',
		CURRENT_DATE,
		9999
	FROM conformed.v_stg_auth_account_creation
	WHERE event_name NOT IN (
			SELECT event_name
			FROM conformed.dim_event
			);

	--

	UPDATE conformed.dim_journey_channel
	SET channel_name = CASE 
			WHEN event_name LIKE '%ipv%'
				THEN 'web'
			WHEN event_name LIKE '%dcmaw%'
				THEN 'app'
			ELSE 'general'
			END,
		channel_description = CASE 
			WHEN event_name LIKE '%ipv%'
				THEN 'event has taken place via web channel'
			WHEN event_name LIKE '%dcmaw%'
				THEN 'event has taken place via app channel'
			ELSE 'general - this is the default channel'
			END,
		modified_by = 'dummy_new',
		modified_date = CURRENT_DATE,
		batch_id = 0000
	FROM (
		SELECT DISTINCT event_name
		FROM conformed.v_stg_auth_account_creation
		) AS st
	WHERE (
			CASE 
				WHEN st.event_name LIKE '%ipv%'
					THEN 'web'
				WHEN st.event_name LIKE '%dcmaw%'
					THEN 'app'
				ELSE 'general'
				END
			) = conformed.dim_journey_channel.channel_name
		AND (
			CASE 
				WHEN st.event_name LIKE '%ipv%'
					THEN 'web'
				WHEN st.event_name LIKE '%dcmaw%'
					THEN 'app'
				ELSE 'general'
				END
			) IN (
			SELECT channel_name
			FROM conformed.dim_journey_channel
			);

    --

	INSERT INTO conformed.dim_journey_channel (
		channel_name,
		channel_description,
		created_by,
		created_date,
		modified_by,
		modified_date,
		batch_id
		)
	SELECT DISTINCT CASE 
			WHEN event_name LIKE '%ipv%'
				THEN 'web'
			WHEN event_name LIKE '%dcmaw%'
				THEN 'app'
			ELSE 'general'
			END,
		CASE 
			WHEN event_name LIKE '%ipv%'
				THEN 'event has taken place via web channel'
			WHEN event_name LIKE '%dcmaw%'
				THEN 'event has taken place via app channel'
			ELSE 'general - this is the default channel'
			END,
		'dummy',
		CURRENT_DATE,
		'dummy',
		CURRENT_DATE,
		9999
	FROM conformed.v_stg_auth_account_creation AS st
	WHERE (
			CASE 
				WHEN st.event_name LIKE '%ipv%'
					THEN 'web'
				WHEN st.event_name LIKE '%dcmaw%'
					THEN 'app'
				ELSE 'general'
				END
			) NOT IN (
			SELECT channel_name
			FROM conformed.dim_journey_channel
			);

	--

	UPDATE conformed.dim_relying_party
	SET client_name = NULL,
		relying_party_name = CASE 
			WHEN client_id = '7y-bchthdfucvr5kcae8kam80wg'
				THEN 'hmrc'
			WHEN client_id = 'rqfz83csms4mi4y7s7ohd9-ekwu'
				THEN 'dvsa'
			WHEN client_id = 'luizbiuj_xvzxwhknaapco4o_6o'
				THEN 'swe'
			WHEN client_id = 'vsakrtmbzaossveav4xsuudyiss'
				THEN 'hmlr'
			WHEN client_id = 'tgygwfxgdnn8ityaecwcopqix3s'
				THEN 'ofqual'
			WHEN client_id = 'pdqo7_hu-pq5wam5i4mlurxrv5k'
				THEN 'msu'
			WHEN client_id = 'mjqc1h7nfvbnm05iawadkkz2w89ulodk'
				THEN 'smoke test'
			ELSE client_id
			END,
		relying_party_description = CASE 
			WHEN client_id = '7y-bchthdfucvr5kcae8kam80wg'
				THEN 'this relying party is hmrc'
			WHEN client_id = 'rqfz83csms4mi4y7s7ohd9-ekwu'
				THEN 'this relying party is dvsa'
			WHEN client_id = 'luizbiuj_xvzxwhknaapco4o_6o'
				THEN 'this relying party is swe'
			WHEN client_id = 'vsakrtmbzaossveav4xsuudyiss'
				THEN 'this relying party is hmlr'
			WHEN client_id = 'tgygwfxgdnn8ityaecwcopqix3s'
				THEN 'this relying party is ofqual'
			WHEN client_id = 'pdqo7_hu-pq5wam5i4mlurxrv5k'
				THEN 'this relying party is msu'
			WHEN client_id = 'mjqc1h7nfvbnm05iawadkkz2w89ulodk'
				THEN 'this is a dummy test id'
			ELSE client_id
			END
	FROM (
		SELECT DISTINCT client_id
		FROM conformed.v_stg_auth_account_creation
		) AS st
	WHERE (
			CASE 
				WHEN client_id = '7y-bchthdfucvr5kcae8kam80wg'
					THEN 'hmrc'
				WHEN client_id = 'rqfz83csms4mi4y7s7ohd9-ekwu'
					THEN 'dvsa'
				WHEN client_id = 'luizbiuj_xvzxwhknaapco4o_6o'
					THEN 'swe'
				WHEN client_id = 'vsakrtmbzaossveav4xsuudyiss'
					THEN 'hmlr'
				WHEN client_id = 'tgygwfxgdnn8ityaecwcopqix3s'
					THEN 'ofqual'
				WHEN client_id = 'pdqo7_hu-pq5wam5i4mlurxrv5k'
					THEN 'msu'
				WHEN client_id = 'mjqc1h7nfvbnm05iawadkkz2w89ulodk'
					THEN 'smoke test'
				ELSE client_id
				END
			) = conformed.dim_relying_party.relying_party_name
		AND (
			CASE 
				WHEN client_id = '7y-bchthdfucvr5kcae8kam80wg'
					THEN 'hmrc'
				WHEN client_id = 'rqfz83csms4mi4y7s7ohd9-ekwu'
					THEN 'dvsa'
				WHEN client_id = 'luizbiuj_xvzxwhknaapco4o_6o'
					THEN 'swe'
				WHEN client_id = 'vsakrtmbzaossveav4xsuudyiss'
					THEN 'hmlr'
				WHEN client_id = 'tgygwfxgdnn8ityaecwcopqix3s'
					THEN 'ofqual'
				WHEN client_id = 'pdqo7_hu-pq5wam5i4mlurxrv5k'
					THEN 'msu'
				WHEN client_id = 'mjqc1h7nfvbnm05iawadkkz2w89ulodk'
					THEN 'smoke test'
				ELSE client_id
				END
			) IN (
			SELECT relying_party_name
			FROM conformed.dim_relying_party
			);

    --

	INSERT INTO conformed.dim_relying_party (
		client_name,
		relying_party_name,
		relying_party_description,
		created_by,
		created_date,
		modified_by,
		modified_date,
		batch_id
		)
	SELECT DISTINCT NULL,
		CASE 
			WHEN client_id = '7y-bchthdfucvr5kcae8kam80wg'
				THEN 'hmrc'
			WHEN client_id = 'rqfz83csms4mi4y7s7ohd9-ekwu'
				THEN 'dvsa'
			WHEN client_id = 'luizbiuj_xvzxwhknaapco4o_6o'
				THEN 'swe'
			WHEN client_id = 'vsakrtmbzaossveav4xsuudyiss'
				THEN 'hmlr'
			WHEN client_id = 'tgygwfxgdnn8ityaecwcopqix3s'
				THEN 'ofqual'
			WHEN client_id = 'pdqo7_hu-pq5wam5i4mlurxrv5k'
				THEN 'msu'
			WHEN client_id = 'mjqc1h7nfvbnm05iawadkkz2w89ulodk'
				THEN 'smoke test'
			ELSE client_id
			END,
		CASE 
			WHEN client_id = '7y-bchthdfucvr5kcae8kam80wg'
				THEN 'this relying party is hmrc'
			WHEN client_id = 'rqfz83csms4mi4y7s7ohd9-ekwu'
				THEN 'this relying party is dvsa'
			WHEN client_id = 'luizbiuj_xvzxwhknaapco4o_6o'
				THEN 'this relying party is swe'
			WHEN client_id = 'vsakrtmbzaossveav4xsuudyiss'
				THEN 'this relying party is hmlr'
			WHEN client_id = 'tgygwfxgdnn8ityaecwcopqix3s'
				THEN 'this relying party is ofqual'
			WHEN client_id = 'pdqo7_hu-pq5wam5i4mlurxrv5k'
				THEN 'this relying party is msu'
			WHEN client_id = 'mjqc1h7nfvbnm05iawadkkz2w89ulodk'
				THEN 'this is a dummy test id'
			ELSE client_id
			END,
		'dummy',
		CURRENT_DATE,
		'dummy',
		CURRENT_DATE,
		9999
	FROM conformed.v_stg_auth_account_creation AS st
	WHERE CASE 
			WHEN client_id = '7y-bchthdfucvr5kcae8kam80wg'
				THEN 'hmrc'
			WHEN client_id = 'rqfz83csms4mi4y7s7ohd9-ekwu'
				THEN 'dvsa'
			WHEN client_id = 'luizbiuj_xvzxwhknaapco4o_6o'
				THEN 'swe'
			WHEN client_id = 'vsakrtmbzaossveav4xsuudyiss'
				THEN 'hmlr'
			WHEN client_id = 'tgygwfxgdnn8ityaecwcopqix3s'
				THEN 'ofqual'
			WHEN client_id = 'pdqo7_hu-pq5wam5i4mlurxrv5k'
				THEN 'msu'
			WHEN client_id = 'mjqc1h7nfvbnm05iawadkkz2w89ulodk'
				THEN 'smoke test'
			ELSE client_id
			END NOT IN (
			SELECT relying_party_name
			FROM conformed.dim_relying_party
			);

	--

	UPDATE conformed.dim_verification_route
	SET verification_route_name = st.sub_domain,
		verification_short_name = st.sub_domain,
		route_description = st.domain
	FROM (
		SELECT DISTINCT domain,
			sub_domain
		FROM conformed.v_stg_auth_account_creation
		WHERE sub_domain IN (
				SELECT verification_route_name
				FROM conformed.dim_verification_route
				)
		) AS st
	WHERE st.sub_domain = conformed.dim_verification_route.verification_route_name;

	INSERT INTO conformed.dim_verification_route (
		verification_route_name,
		verification_short_name,
		route_description,
		created_by,
		created_date,
		modified_by,
		modified_date,
		batch_id
		)
	SELECT DISTINCT sub_domain,
		sub_domain,
		domain,
		'dummy',
		CURRENT_DATE,
		'dummy',
		CURRENT_DATE,
		9999
	FROM conformed.v_stg_auth_account_creation
	WHERE sub_domain NOT IN (
			SELECT verification_route_name
			FROM conformed.dim_verification_route
			);

    --

	UPDATE "dap_txma_reporting_db"."conformed"."fact_user_journey_event"
	SET rejection_reason = st.rejection_reason,
		reason = st.reason,
		notification_type = st.notification_type,
		mfa_type = st.mfa_type,
		account_recovery = st.account_recovery,
		failed_check_details_biometric_verification_process_level = st.failed_check_details_biometric_verification_process_level,
		check_details_biometric_verification_process_level = st.check_details_biometric_verification_process_level,
		addresses_entered = st.addresses_entered,
		activity_history_score = st.activity_history_score,
		identity_fraud_score = st.identity_fraud_score,
		decision_score = st.decision_score,
		failed_check_details_kbv_response_mode = st.failed_check_details_kbv_response_mode,
		failed_check_details_check_method = st.failed_check_details_check_method,
		check_details_kbv_response_model = st.check_details_kbv_response_model,
		check_details_kbv_quality = st.check_details_kbv_quality,
		verification_score = st.verification_score,
		check_details_check_method = st.check_details_check_method,
		iss = st.iss,
		validity_score = st.validity_score,
		"type" = st."type",
		processed_date = st.processed_date,
		modified_by = 'dummy_new',
		modified_date = CURRENT_DATE,
		batch_id = 0000
	FROM (
		SELECT *
		FROM conformed.v_stg_auth_account_creation
		WHERE event_id IN (
				SELECT event_id
				FROM "dap_txma_reporting_db"."conformed"."fact_user_journey_event"
				)
		) AS st
	WHERE fact_user_journey_event.event_id = st.event_id;

    --

	INSERT INTO conformed.fact_user_journey_event (
		event_key,
		date_key,
		verification_route_key,
		journey_channel_key,
		relying_party_key,
		user_id,
		event_id,
		event_time,
		journey_id,
		component_id,
		event_count,
		rejection_reason,
		reason,
		notification_type,
		mfa_type,
		account_recovery,
		failed_check_details_biometric_verification_process_level,
		check_details_biometric_verification_process_level,
		addresses_entered,
		activity_history_score,
		identity_fraud_score,
		decision_score,
		failed_check_details_kbv_response_mode,
		failed_check_details_check_method,
		check_details_kbv_response_model,
		check_details_kbv_quality,
		verification_score,
		check_details_check_method,
		iss,
		validity_score,
		"type",
		processed_date,
		created_by,
		created_date,
		modified_by,
		modified_date,
		batch_id
		)
	SELECT nvl(de.event_key, - 1) AS event_key,
		dd.date_key,
		nvl(dvr.verification_route_key, - 1) AS verification_route_key,
		nvl(djc.journey_channel_key, - 1) AS journey_channel_key,
		nvl(drp.relying_party_key, - 1) AS relying_party_key,
		user_user_id AS user_id,
		event_id AS event_id,
		--,cnf.event_name
		--,cnf.timestamp as event_time
		cnf.timestamp_formatted AS event_time,
		cnf.user_govuk_signin_journey_id AS journey_id,
		cnf.component_id AS component_id,
		event_count,
		rejection_reason,
		reason,
		notification_type,
		mfa_type,
		account_recovery,
		failed_check_details_biometric_verification_process_level,
		check_details_biometric_verification_process_level,
		addresses_entered,
		activity_history_score,
		identity_fraud_score,
		decision_score,
		failed_check_details_kbv_response_mode,
		failed_check_details_check_method,
		check_details_kbv_response_model,
		check_details_kbv_quality,
		verification_score,
		check_details_check_method,
		iss,
		validity_score,
		"type",
		processed_date,
		'dummy',
		CURRENT_DATE,
		'dummy',
		CURRENT_DATE,
		9999
	FROM (
		SELECT *
		FROM conformed.v_stg_auth_account_creation
		WHERE event_id NOT IN (
				SELECT event_id
				FROM conformed.fact_user_journey_event
				)
		) cnf
	JOIN conformed.dim_date dd ON DATE (cnf.timestamp_formatted) = dd.DATE
	LEFT JOIN conformed.dim_event de ON cnf.event_name = de.event_name
	LEFT JOIN conformed.dim_journey_channel djc ON (
			CASE 
				WHEN cnf.event_name LIKE '%ipv%'
					THEN 'web'
				WHEN cnf.event_name LIKE '%dcmaw%'
					THEN 'app'
				ELSE 'general'
				END
			) = djc.channel_name
	LEFT JOIN conformed.dim_relying_party drp ON (
			CASE cnf.client_id
				WHEN '7y-bchthdfucvr5kcae8kam80wg'
					THEN 'hmrc'
				WHEN 'rqfz83csms4mi4y7s7ohd9-ekwu'
					THEN 'dvsa'
				WHEN 'luizbiuj_xvzxwhknaapco4o_6o'
					THEN 'swe'
				WHEN 'vsakrtmbzaossveav4xsuudyiss'
					THEN 'hmlr'
				WHEN 'tgygwfxgdnn8ityaecwcopqix3s'
					THEN 'ofqual'
				WHEN 'pdqo7_hu-pq5wam5i4mlurxrv5k'
					THEN 'msu'
				WHEN 'mjqc1h7nfvbnm05iawadkkz2w89ulodk'
					THEN 'smoke test'
				ELSE cnf.client_id
				END
			) = drp.relying_party_name
	LEFT JOIN conformed.dim_verification_route dvr ON cnf.sub_domain = dvr.verification_route_name;

	UPDATE conformed.batchcontrol batc
	SET maxrundate = cast(subquery.updated_value AS DATE)
	FROM (
		SELECT product_family,
			max(processed_date) updated_value
		FROM conformed.v_stg_auth_account_creation
		GROUP BY product_family
		) AS subquery
	WHERE batc.product_family = subquery.product_family;

	raise info 'processing of product family: auth_account_creation ran successfully';

	exception when others then raise exception '[error while processing product family: auth_account_creation] exception: %',
		sqlerrm;
END;$$

LANGUAGE plpgsql;
