INSERT INTO "environment-txma-stage"."ipv_cri_ftof" (
	event_id,
	component_id,
	user_user_id,
	timestamp,
	timestamp_formatted,
	extensions_previousgovuksigninjourneyid,
	year,
	month,
	day,
	processed_date,
	event_name
)
SELECT
	event_id as event_id,
	component_id as component_id,
	user.user_id as user_user_id,
	timestamp as timestamp,
	timestamp_formatted as timestamp_formatted,
	replace(format('%s',cast("extensions"."previous_govuk_signin_journey_id" as JSON)),'null',NULL) as extensions_previousgovuksigninjourneyid,
	CAST(year as INT) as year,
	CAST(month as INT) as month,
	CAST(day as INT) as day,
	CAST(date_format(now(), '%Y%m%d') as VARCHAR) AS processed_date,
	event_name as event_name
FROM 
	"environment-txma-raw"."ipr_result_notification_emailed"
WHERE
	CAST(concat(year, month, day) AS INT) > filter_value AND
	CAST(concat(year, month, day) AS INT) < CAST(date_format(now(), '%Y%m%d') as INT)
;