INSERT INTO "environment-txma-stage"."ipv_cri_kbv" (
	event_id,
	component_id,
	user_govuk_signin_journey_id,
	user_user_id,
	timestamp,
	timestamp_formatted,
	extensions_evidence,
	extensions_iss,
	extensions_experianiiqresponse,
	year,
	month,
	day,
	processed_date,
	event_name
)
SELECT
	event_id as event_id,
	component_id as component_id,
	user.govuk_signin_journey_id as user_govuk_signin_journey_id,
	user.user_id as user_user_id,
	timestamp as timestamp,
	timestamp_formatted as timestamp_formatted,
	case format('%s',cast("extensions"."evidence" as JSON))
		when 'null' then null
	    else format('%s',cast("extensions"."evidence" as JSON))
	end as extensions_evidence,
	case format('%s',cast("extensions"."iss" as VARCHAR))
		when 'null' then null
	    else format('%s',cast("extensions"."iss" as VARCHAR))
	end as extensions_iss,
	case format('%s',cast("extensions"."experianIiqResponse" as JSON))
		when 'null' then null
	    else format('%s',cast("extensions"."experianIiqResponse" as JSON))
	end as extensions_experianiiqresponse,
	CAST(year as INT) as year,
	CAST(month as INT) as month,
	CAST(day as INT) as day,
	CAST(date_format(now(), '%Y%m%d') as VARCHAR) AS processed_date,
	event_name as event_name
FROM 
	"environment-txma-raw"."ipv_kbv_cri_vc_issued"
WHERE
	CAST(concat(year, month, day) AS INT) > filter_value AND
	CAST(concat(year, month, day) AS INT) < CAST(date_format(now(), '%Y%m%d') as INT)
;