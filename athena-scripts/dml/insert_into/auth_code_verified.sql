INSERT INTO "environment-txma-stage"."auth_account_mfa" (
	event_id,
	client_id,
	component_id,
	user_govuk_signin_journey_id,
	user_user_id,
	timestamp,
	timestamp_formatted,
	extensions_accountrecovery,
	extensions_mfatype,
	extensions_notificationtype,
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
	case format('%s',cast("extensions"."account-recovery" as JSON))
		when 'null' then null
	    else format('%s',cast("extensions"."account-recovery" as JSON)) 
	end as extensions_accountrecovery,
	case format('%s',cast("extensions"."mfa-type" as JSON))
		when 'null' then null
	    else format('%s',cast("extensions"."mfa-type" as JSON))
	end as extensions_mfatype,
	case format('%s',cast("extensions"."notification-type" as JSON))
		when 'null' then null
	    else format('%s',cast("extensions"."notification-type" as JSON)) 
	end as extensions_notificationtype,
	CAST(year as INT) as year,
	CAST(month as INT) as month,
	CAST(day as INT) as day,
	CAST(date_format(now(), '%Y%m%d') as VARCHAR) AS processed_date,
	event_name as event_name
FROM 
	"environment-txma-raw"."auth_code_verified"
WHERE
	CAST(concat(year, month, day) AS INT) > filter_value AND
	CAST(concat(year, month, day) AS INT) < CAST(date_format(now(), '%Y%m%d') as INT)
;