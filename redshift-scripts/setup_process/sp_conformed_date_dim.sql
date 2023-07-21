CREATE OR replace PROCEDURE dev_conformed.redshift_date_dim (v_start_date VARCHAR(20),v_end_date VARCHAR(20)) 
AS $$
BEGIN
	DECLARE 
        start_date DATE;
	    end_date DATE;
	    count INT;

	BEGIN
		
        --
        CREATE TABLE IF NOT EXISTS conformed.dim_date (
            date_key int,
            date date,
            DAY varchar(50),
            day_suffix varchar(50),
            weekday varchar(50),
            weekday_name varchar(50),
            weekday_name_short varchar(10),
            day_of_week_in_month varchar(50),
            day_of_year varchar(10),
            week_of_year varchar(10),
            MONTH varchar(50),
            month_name varchar(50),
            month_name_short varchar(10),
            quarter varchar(50),
            quarter_name varchar(50),
            year varchar(10),
            is_weekend char(1),
            created_by varchar(100),
            created_date date,
            modified_by varchar(100),
            modified_date date,
            batch_id integer,
            PRIMARY KEY (date_key)
        ) diststyle auto sortkey auto encode auto;
        --
        
        --start_date := '2022-08-01';
		--end_date := '2024-12-31’;
		start_date := v_start_date;
		end_date := v_end_date;
		count := 0;

		WHILE start_date <= end_date LOOP
			--raise info 'date: %', start_date;
			INSERT INTO dev_conformed.dim_date (
				date_key,
				DATE,
				day,
				day_suffix,
				weekday,
				weekday_name,
				weekday_name_short,
				day_of_week_in_month,
				day_of_year,
				week_of_year,
				month,
				month_name,
				month_name_short,
				quarter,
				quarter_name,
				year,
				is_weekend,
				created_by,
				created_date,
				modified_by,
				modified_date,
				batch_id
				)
			SELECT extract(year FROM start_date) * 10000 + extract(month FROM start_date) * 100 + extract(day FROM start_date) date_key,
				start_date,
				to_char(start_date, 'dd'),
				CASE 
					WHEN extract(day FROM start_date) = 1
						OR extract(day FROM start_date) = 21
						OR extract(day FROM start_date) = 31
						THEN 'st'
					WHEN extract(day FROM start_date) = 2
						OR extract(day FROM start_date) = 22
						THEN 'nd'
					WHEN extract(day FROM start_date) = 3
						OR extract(day FROM start_date) = 23
						THEN 'rd'
					ELSE 'th'
					END AS day_suffix,
				extract(dow FROM start_date) AS weekday,
				to_char(start_date, 'day') AS weekday_name,
				upper(to_char(start_date, 'dy')) AS weekday_name_short,
				0 day_of_week_in_month,
				extract(doy FROM start_date)::VARCHAR || ' - ' || extract(year FROM start_date)::VARCHAR AS day_of_year,
				floor(datediff('week', date_trunc('year', start_date), start_date)) + 1 AS week_of_year,
				extract(month FROM start_date) AS month,
				to_char(start_date, 'month') AS month_name,
				upper(substring(to_char(start_date, 'month'), 1, 3)) AS month_name_short,
				(extract(month FROM start_date) + 2) / 3 AS quarter,
				CASE 
					WHEN extract(quarter FROM start_date) = 1
						THEN 'first'
					WHEN extract(quarter FROM start_date) = 2
						THEN 'second'
					WHEN extract(quarter FROM start_date) = 3
						THEN 'third'
					WHEN extract(quarter FROM start_date) = 4
						THEN 'fourth'
					END AS quarter_name,
				extract(year FROM start_date) AS year,
				CASE 
					WHEN to_char(start_date, 'day') = 'sunday'
						OR to_char(start_date, 'day') = 'saturday'
						THEN 1
					ELSE 0
					END AS is_weekend,
				'dummy user',
				CURRENT_DATE,
				'dummy user',
				CURRENT_DATE,
				9999;

		count : = count + 1;
		start_date : = start_date + interval '1 day';
	    END

	LOOP;

	raise info 'total count: %',count;
    END;
END;

$$ LANGUAGE plpgsql;
