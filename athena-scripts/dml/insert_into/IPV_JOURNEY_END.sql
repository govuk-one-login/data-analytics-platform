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
	extensions_error_code,
	extensions_error_description,
	extensions_gpg45profile,
	extensions_gpg45scores,
	extensions_levelofconfidence,
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
	'' as extensions_error_code,
	'' as extensions_error_description,
	'' as extensions_gpg45profile,
	'' as extensions_gpg45scores,
	'' as extensions_levelofconfidence,
	CAST(year as INT) as year,
	CAST(month as INT) as month,
	CAST(day as INT) as day,
	CAST(date_format(now(), '%Y%m%d') as INT) AS processed_date,
	event_name as event_name
FROM 
	"environment-txma-raw"."ipv_journey_end"
WHERE
	CAST(concat(year, month, day) AS INT) > filter_value AND
	CAST(concat(year, month, day) AS INT) < CAST(date_format(now(), '%Y%m%d') as INT)
;