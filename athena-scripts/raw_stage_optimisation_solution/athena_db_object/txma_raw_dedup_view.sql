-- This script should be run against the same database the txma (raw) table resides within
CREATE OR REPLACE VIEW "txma_deduplicated" AS 
SELECT *
FROM
  (
   SELECT
     row_number() OVER (PARTITION BY event_id, timestamp ORDER BY CAST(concat(concat(year, month), day) AS integer) ASC) row_num
   , *
   FROM
     txma
) 
WHERE (row_num = 1)