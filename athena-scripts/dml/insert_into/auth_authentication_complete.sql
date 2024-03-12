INSERT INTO "environment-txma-stage"."auth_account_user_login" (
	event_id,
	client_id,
	component_id,
	user_govuk_signin_journey_id,
	user_user_id,
	timestamp,
	timestamp_formatted,
	extensions_isnewaccount,
	extensions_testuser,
	year,
	month,
	day,
	processed_date,
	event_name
)
SELECT
	event_id as event_id,
	client_id as client_id,
	component_id as component_id,
	user.govuk_signin_journey_id as user_govuk_signin_journey_id,
	user.user_id as user_user_id,
	timestamp as timestamp,
	timestamp_formatted as timestamp_formatted,
	case format('%s',cast("extensions"."new_account" as VARCHAR)) 
		when 'null' then null
	    else format('%s',cast("extensions"."new_account" as VARCHAR)) 
	end as extensions_isnewaccount,
	case format('%s',cast("extensions"."test_user" as VARCHAR)) 
		when 'null' then null
	    else format('%s',cast("extensions"."test_user" as VARCHAR)) 
	end as extensions_testuser,
	CAST(year as INT) as year,
	CAST(month as INT) as month,
	CAST(day as INT) as day,
	CAST(date_format(now(), '%Y%m%d') as VARCHAR) AS processed_date,
	event_name as event_name
FROM 
	"environment-txma-raw"."auth_authentication_complete"
WHERE
	CAST(concat(year, month, day) AS INT) > filter_value AND
	CAST(concat(year, month, day) AS INT) < CAST(date_format(now(), '%Y%m%d') as INT)
;