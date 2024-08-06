CREATE OR REPLACE VIEW "raw_database"."txma_deduplicated" AS 
SELECT *
FROM
  (
   SELECT
     row_number() OVER (PARTITION BY event_id, timestamp ORDER BY CAST(concat(concat(year, month), day) AS integer) ASC) row_num
   , *
   FROM
     "raw_database"."txma"
) 
WHERE (row_num = 1);
