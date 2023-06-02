INSERT INTO "stage-layer"."auth_create_account" (
		event_id,
		event_name,
		client_id,
		component_id,
		timestamp,
		timestamp_formatted,
		user_user_id,
		user_govuk_signin_journey_id,
		year,
		month,
		day,
		processed_date
	)
SELECT event_id as event_id,
	event_name as event_name,
	client_id as client_id,
	component_id as component_id,
	timestamp as timestamp,
	timestamp_formatted as timestamp_formatted,
	user.user_id as user_user_id,
	user.govuk_signin_journey_id as user_govuk_signin_journey_id,
	CAST(year as INT) as year,
	CAST(month as INT) as month,
	CAST(day as INT) as day,
	CAST(date_format(now(), '%Y%m%d') as INT) AS processed_date
FROM "raw-layer"."auth_create_account"
WHERE CAST(concat(year, month, day) AS INT) > filter_value AND
CAST(concat(year, month, day) AS INT) < CAST(date_format(now(), '%Y%m%d') as INT);