CREATE OR REPLACE PROCEDURE conformed_refactored.redshift_date_dim(v_start_date character varying(20), v_end_date character varying(20))
 LANGUAGE plpgsql
AS $$
BEGIN
    DECLARE
        start_date date;
        end_date date;
        count int;
    BEGIN

    start_date := v_start_date;
    end_date := v_end_date;
        count := 0;
        
        WHILE start_date <= end_date LOOP
            --RAISE INFO 'Date: %', start_date;
            insert into conformed_refactored.dim_date_refactored(DATE_KEY,DATE,DAY,DAY_SUFFIX,WEEKDAY,WEEKDAY_NAME,weekday_name_short,DAY_OF_WEEK_IN_MONTH,
                                               day_of_year,week_of_year,month,month_name,month_name_short,quarter,quarter_name,year,is_weekend,
                                               CREATED_BY,CREATED_DATE,MODIFIED_BY,MODIFIED_DATE,BATCH_ID)
            SELECT   EXTRACT(YEAR FROM start_date) * 10000 + EXTRACT(MONTH FROM start_date) * 100 + EXTRACT(DAY FROM start_date) DATE_KEY,
            start_date,
            TO_CHAR(start_date, 'DD'),
            CASE 
                WHEN EXTRACT(DAY FROM start_date) = 1
                    OR EXTRACT(DAY FROM start_date) = 21
                    OR EXTRACT(DAY FROM start_date) = 31
                    THEN 'st'
                WHEN EXTRACT(DAY FROM start_date) = 2
                    OR EXTRACT(DAY FROM start_date) = 22
                    THEN 'nd'
                WHEN EXTRACT(DAY FROM start_date) = 3
                    OR EXTRACT(DAY FROM start_date) = 23
                    THEN 'rd'
                ELSE 'th'
            END AS DAY_SUFFIX ,
            EXTRACT(DOW FROM start_date) AS WEEKDAY,
            TO_CHAR(start_date, 'Day') AS weekday_name,
            UPPER(TO_CHAR(start_date, 'Dy')) AS weekday_name_short,
            0 DAY_OF_WEEK_IN_MONTH,
            EXTRACT(DOY FROM start_date)::VARCHAR || ' - ' || EXTRACT(YEAR FROM start_date)::VARCHAR AS day_of_year,
            FLOOR(DATEDIFF('week', DATE_TRUNC('year', start_date), start_date)) + 1 AS week_of_year,
            EXTRACT(MONTH FROM start_date) AS month,
            TO_CHAR(start_date, 'Month') AS month_name,
            UPPER(SUBSTRING(TO_CHAR(start_date, 'Month'), 1, 3)) AS month_name_short,
            (EXTRACT(MONTH FROM start_date) + 2) / 3 AS quarter,
            CASE
                WHEN EXTRACT(QUARTER FROM start_date) = 1 THEN 'First'
                WHEN EXTRACT(QUARTER FROM start_date) = 2 THEN 'Second'
                WHEN EXTRACT(QUARTER FROM start_date) = 3 THEN 'Third'
                WHEN EXTRACT(QUARTER FROM start_date) = 4 THEN 'Fourth'
            END AS quarter_name,
            EXTRACT(YEAR FROM start_date)  AS year,
            CASE
                WHEN TO_CHAR(start_date, 'Day') = 'Sunday' OR TO_CHAR(start_date, 'Day') = 'Saturday'
                THEN 1
                ELSE 0
            END AS is_weekend,
            'DUMMY USER',
            CURRENT_DATE,
            'DUMMY USER',
            CURRENT_DATE,
            9999 ;
            count := count + 1;
            start_date := start_date + INTERVAL '1 DAY';
        END LOOP;
        
        RAISE INFO 'Total count: %', count;
    END;
END;
$$


--call conformed_refactored.redshift_date_dim('2022-01-01','2030-12-31')
