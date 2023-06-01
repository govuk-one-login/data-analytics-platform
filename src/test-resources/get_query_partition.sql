WITH get_latest_stg_processed_dt AS (
	SELECT coalesce(max(processed_date), 20000101) as processed_date
	FROM "stage-layer"."tablename$partitions"
),
get_stg_partitions AS (
	SELECT DISTINCT year,
		month,
		day
	FROM "stage-layer"."tablename" stg,
		get_latest_stg_processed_dt
	WHERE stg.processed_date = get_latest_stg_processed_dt.processed_date
),
get_stg_filter_values AS (
	SELECT MAX(
			CAST(
				CONCAT(
					CAST(year AS varchar),
					CAST(LPAD(CAST(month AS varchar), 2, '0') AS varchar),
					CAST(LPAD(CAST(day AS varchar), 2, '0') AS varchar)
				) AS int
			)
		) as max_partition_value
	from get_stg_partitions
	UNION ALL
	select 20000101 as max_partition_value
	from (
			values(1)
		) as t(dummy)
	where not exists (
			select 1
			from get_stg_partitions
		)
)
select max(max_partition_value) as max_partition_value
from get_stg_filter_values;
