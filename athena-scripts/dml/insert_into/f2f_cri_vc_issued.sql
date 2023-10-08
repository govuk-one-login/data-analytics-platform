INSERT INTO "environment-txma-stage"."ipv_cri_ftof" (
	event_id,
	client_id,
	component_id,
	user_govuk_signin_journey_id,
	user_user_id,
	timestamp,
	timestamp_formatted,
	extensions_evidence,
	extensions_previousgovuksigninjourneyid,
	restricted_passport,
	restricted_residencepermit,
	restricted_drivingpermit,
	restricted_idcard,
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
	case format('%s',cast("extensions"."evidence" as JSON))
		when 'null' then null
	    else format('%s',cast("extensions"."evidence" as JSON))	
	end as extensions_evidence,
	case format('%s',cast("extensions"."previous_govuk_signin_journey_id" as VARCHAR))
		when 'null' then null
	    else format('%s',cast("extensions"."previous_govuk_signin_journey_id" as VARCHAR))
	end as extensions_previousgovuksigninjourneyid,
	case format('%s',cast("restricted"."passport" as JSON))
		when 'null' then null
	    else format('%s',cast("restricted"."passport" as JSON))
	end as restricted_passport,
	case format('%s',cast("restricted"."residencePermit" as JSON))
		when 'null' then null
	    else format('%s',cast("restricted"."residencePermit" as JSON))
	end as restricted_residencepermit,
	case format('%s',cast("restricted"."drivingPermit" as JSON))
		when 'null' then null
	    else format('%s',cast("restricted"."drivingPermit" as JSON))
	end as restricted_drivingpermit,
	case format('%s',cast("restricted"."idCard" as JSON))
		when 'null' then null
	    else format('%s',cast("restricted"."idCard" as JSON))
	end as restricted_idcard,
	CAST(year as INT) as year,
	CAST(month as INT) as month,
	CAST(day as INT) as day,
	CAST(date_format(now(), '%Y%m%d') as VARCHAR) AS processed_date,
	event_name as event_name
FROM 
	"environment-txma-raw"."f2f_cri_vc_issued"
WHERE
	CAST(concat(year, month, day) AS INT) > filter_value AND
	CAST(concat(year, month, day) AS INT) < CAST(date_format(now(), '%Y%m%d') as INT)
;