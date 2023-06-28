INSERT INTO "environment-txma-stage"."ipv_journey" (
	event_id,
	client_id,
	component_id,
	user_govuk_signin_journey_id,
	user_user_id,
	timestamp,
	timestamp_formatted,
	extensions_evidence,
	extensions_successful,
	extensions_errorcode,
	extensions_error,
	extensions_gpg45profile,
	extensions_gpg45scores,
	extensions_levelofconfidence,
	extensions_reason,
	extensions_rejectionreason,
	year,
	month,
	day,
	processed_date,
	event_name
)
SELECT
	event_id as event_id,
	'' as client_id,
	component_id as component_id,
	user.govuk_signin_journey_id as user_govuk_signin_journey_id,
	user.user_id as user_user_id,
	timestamp as timestamp,
	timestamp_formatted as timestamp_formatted,
	'' as extensions_evidence,
	'' as extensions_successful,
	'' as extensions_errorcode,
	'' as extensions_error,
	'' as extensions_gpg45profile,
	'' as extensions_gpg45scores,
	'' as extensions_levelofconfidence,
	'' as extensions_reason,
	'' as extensions_rejectionreason,
	CAST(year as INT) as year,
	CAST(month as INT) as month,
	CAST(day as INT) as day,
	CAST(date_format(now(), '%Y%m%d') as VARCHAR) AS processed_date,
	event_name as event_name
FROM 
	"environment-txma-raw"."ipv_identity_reuse_complete"
WHERE
	CAST(concat(year, month, day) AS INT) > filter_value AND
	CAST(concat(year, month, day) AS INT) < CAST(date_format(now(), '%Y%m%d') as INT)
;