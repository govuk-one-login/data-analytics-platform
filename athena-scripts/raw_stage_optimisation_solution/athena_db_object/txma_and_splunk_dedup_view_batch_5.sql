WITH splunk_migration AS (
	SELECT *
	FROM "raw_database"."splunk_migration"
	WHERE partition_0 in (
'AUTH_MFA_CODE_SENT', 'AUTH_PROCESSING_IDENTITY_REQUEST', 'AUTH_UPDATE_PROFILE_AUTH_APP', 'AUTH_UPDATE_PROFILE_PHONE_NUMBER', 'AUTH_USERINFO_SENT_TO_ORCHESTRATION', 'CIC_CRI_AUTH_CODE_ISSUED', 'CIC_CRI_START', 'DCMAW_ABORT_APP', 'DCMAW_CRI_4XXERROR', 'DCMAW_CRI_5XXERROR', 'DCMAW_CRI_VC_ISSUED', 'DCMAW_IPROOV_BILLING_STARTED', 'DCMAW_READID_NFC_BILLING_STARTED', 'DCMAW_REDIRECT_ABORT', 'DCMAW_SESSION_RECOVERED', 'F2F_CRI_END', 'F2F_YOTI_RESPONSE_RECEIVED', 'IPR_RESULT_NOTIFICATION_EMAILED', 'IPR_USER_REDIRECTED', 'IPV_ADDRESS_CRI_REQUEST_SENT', 'IPV_CONTRA_INDICATOR_STORAGE_GET_END', 'IPV_CONTRA_INDICATOR_STORAGE_PUT_NEW_CIS', 'IPV_CONTRA_INDICATOR_STORAGE_PUT_START', 'IPV_DL_CRI_REQUEST_SENT', 'IPV_F2F_PROFILE_NOT_MET_FAIL' 
		)
),
txma AS (
	SELECT *
	FROM "raw_database"."txma"
	WHERE partition_0 in (
'AUTH_MFA_CODE_SENT', 'AUTH_PROCESSING_IDENTITY_REQUEST', 'AUTH_UPDATE_PROFILE_AUTH_APP', 'AUTH_UPDATE_PROFILE_PHONE_NUMBER', 'AUTH_USERINFO_SENT_TO_ORCHESTRATION', 'CIC_CRI_AUTH_CODE_ISSUED', 'CIC_CRI_START', 'DCMAW_ABORT_APP', 'DCMAW_CRI_4XXERROR', 'DCMAW_CRI_5XXERROR', 'DCMAW_CRI_VC_ISSUED', 'DCMAW_IPROOV_BILLING_STARTED', 'DCMAW_READID_NFC_BILLING_STARTED', 'DCMAW_REDIRECT_ABORT', 'DCMAW_SESSION_RECOVERED', 'F2F_CRI_END', 'F2F_YOTI_RESPONSE_RECEIVED', 'IPR_RESULT_NOTIFICATION_EMAILED', 'IPR_USER_REDIRECTED', 'IPV_ADDRESS_CRI_REQUEST_SENT', 'IPV_CONTRA_INDICATOR_STORAGE_GET_END', 'IPV_CONTRA_INDICATOR_STORAGE_PUT_NEW_CIS', 'IPV_CONTRA_INDICATOR_STORAGE_PUT_START', 'IPV_DL_CRI_REQUEST_SENT', 'IPV_F2F_PROFILE_NOT_MET_FAIL' 
		)
),
combine AS (
	SELECT event_id,
		event_name,
		component_id,
		timestamp,
		timestamp_formatted,
		user,
		event_timestamp_ms,
		event_timestamp_ms_formatted,
		txma,
		client_id,
		CAST(
			row(
				extensions."mfa-type",
				extensions.test_user,
				extensions.new_account,
				extensions."client-name",
				extensions.description,
				extensions.isnewaccount,
				extensions."notification-type",
				extensions."account-recovery",
				extensions.clientlandingpageurl,
				extensions.iss,
				extensions.evidence,
				extensions.previous_govuk_signin_journey_id,
				extensions.notify_reference,
				extensions.zendesk_ticket_number,
				extensions.suspicious_activities,
				NULL,
				-- reference_code
				extensions.addressesentered,
				extensions.error_code,
				extensions.error_description,
				extensions.successful,
				extensions.gpg45scores,
				extensions.levelofconfidence,
				extensions.cifail,
				extensions.hasmitigations,
				extensions.returncodes,
				extensions.exitcode,
				extensions.reprove_identity,
				extensions.experianiiqresponse,
				extensions.mitigation_type,
				extensions.rejectionreason,
				extensions.reason,
				extensions.journey_type,
				extensions.age,
				extensions.isukissued
			) AS row(
				"mfa-type" varchar,
				test_user boolean,
				new_account boolean,
				"client-name" varchar,
				description varchar,
				isnewaccount varchar,
				"notification-type" varchar,
				"account-recovery" boolean,
				clientlandingpageurl varchar,
				iss varchar,
				evidence array(
					row(
						identityfraudscore integer,
						type varchar,
						strengthscore integer,
						validityscore integer,
						checkdetails array(
							row(
								checkmethod varchar,
								biometricverificationprocesslevel integer,
								photoverificationprocesslevel integer,
								kbvresponsemode varchar,
								kbvquality integer
							)
						),
						activityhistoryscore integer,
						failedcheckdetails array(
							row(
								checkmethod varchar,
								biometricverificationprocesslevel integer,
								kbvresponsemode varchar
							)
						),
						verificationscore integer,
						mitigations array(
							row(
								code varchar,
								mitigatingcredentialissuer array(varchar)
							)
						),
						decisionscore varchar
					)
				),
				previous_govuk_signin_journey_id varchar,
				notify_reference varchar,
				zendesk_ticket_number varchar,
				suspicious_activities array(
					row(
						client_id varchar,
						event_id varchar,
						event_type varchar,
						timestamp integer,
						session_id varchar
					)
				),
				reference_code varchar,
				addressesentered integer,
				error_code varchar,
				error_description varchar,
				successful boolean,
				gpg45scores row(
					evidences array(
						row(
							strength integer,
							validity integer
						)
					),
					activity integer,
					fraud integer,
					verification integer
				),
				levelofconfidence varchar,
				cifail boolean,
				hasmitigations boolean,
				returncodes array(
					row(
						code varchar,
						issuers array(varchar)
					)
				),
				exitcode array(varchar),
				reprove_identity boolean,
				experianiiqresponse row(
					outcome varchar,
					totalquestionsansweredcorrect integer,
					totalquestionsansweredincorrect integer,
					totalquestionsasked integer
				),
				mitigation_type varchar,
				rejectionreason varchar,
				reason varchar,
				journey_type varchar,
				age integer,
				isukissued boolean
			)
		) AS extensions,
		restricted,
		reingestcount,
		partition_0,
		year,
		month,
		day
	FROM splunk_migration
	UNION ALL
	SELECT *
	FROM txma
)

CREATE OR REPLACE VIEW "raw_database"."txma_and_splunk_dedup_view_batch_5" AS 
SELECT *
FROM
  (
   SELECT
     row_number() OVER (PARTITION BY event_id, timestamp ORDER BY CAST(concat(concat(year, month), day) AS integer) DESC) row_num
   , *
   FROM
     combine
) 
WHERE (row_num = 1);
