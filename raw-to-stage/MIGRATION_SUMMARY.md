# Raw-to-Stage ETL Migration to PySpark

## Overview
Successfully migrated the raw-to-stage ETL from pandas/awswrangler to pure PySpark on AWS Glue. This migration eliminates external dependencies and leverages native Glue/Spark capabilities for better performance and reliability.

## Migration Changes

### Dependencies Removed
- `awswrangler==3.14.0` - Replaced with native PySpark operations
- `awsglue-dev==2021.12.30` - Not needed for production Glue jobs
- `pandas` usage - All dataframe operations now use PySpark

### Key Files Modified

#### 1. `/requirements.txt`
- Removed awswrangler, awsglue-dev dependencies
- Kept core dependencies: boto3, pyspark

#### 2. `/raw_to_stage_etl/clients/glue_table_query_and_write.py`
- Fully migrated to use native PySpark SQL and Glue catalog integration
- Uses `spark.sql()` for queries instead of awswrangler
- Uses `dataframe.write.saveAsTable()` for writing to Glue catalog
- Maintains backward compatibility by returning lists of DataFrames

#### 3. `/raw_to_stage_etl/util/data_preprocessing.py`
- Converted pandas-specific operations to PySpark equivalents:
  - `df.empty` → `df.rdd.isEmpty()`
  - `df["col"].iloc[0]` → `df.collect()[0]["col"]`
- Updated exception types for consistency
- Maintained all data transformation logic using PySpark functions

#### 4. `/raw_to_stage_etl/util/database_utilities.py`
- Updated to work with PySpark DataFrames
- Changed `df.collect()` patterns for accessing row data
- Maintained all database utility functions

#### 5. Documentation Updates
- Updated docstrings to reflect PySpark usage instead of pandas
- Removed old pandas-based job file
- Updated test files to use PySpark DataFrames

### Files Removed
- `raw_to_stage_process_glue_job_v5_pandas.py` - Old pandas-based version

### Test Updates
- `tests/clients/test_glue_table_query_and_write.py` - Updated to test PySpark operations
- `tests/util/test_database_utilities.py` - Converted from pandas to PySpark DataFrames

## Benefits of Migration

### Performance Improvements
- Native Spark operations are more efficient for large datasets
- Better memory management with Spark's lazy evaluation
- Improved parallel processing capabilities

### Reduced Dependencies
- Eliminates awswrangler dependency chain
- Simpler deployment with fewer external libraries
- Reduced security surface area

### Better Integration
- Native Glue catalog integration
- More reliable Spark SQL operations
- Better error handling and logging

### Scalability
- Better handling of large datasets
- Improved partition-aware operations
- More efficient resource utilization

## Technical Details

### Spark Configuration
The main job initializes Spark with optimized settings:
```python
spark = SparkSession.builder \
    .appName("raw-to-stage-etl") \
    .config("spark.sql.adaptive.enabled", "true") \
    .config("spark.sql.adaptive.coalescePartitions.enabled", "true") \
    .config("spark.serializer", "org.apache.spark.serializer.KryoSerializer") \
    .getOrCreate()
```

### Glue Catalog Integration
Uses native Spark SQL with Hive catalog implementation:
```python
self.spark.conf.set("spark.sql.catalogImplementation", "hive")
self.spark.sql(f"USE {database}")
df = self.spark.sql(query)
```

### Data Writing
Uses native PySpark writing with automatic Glue catalog registration:
```python
writer = dataframe.write.mode(insert_mode).option("path", s3_path)
if partition_cols:
    writer = writer.partitionBy(*partition_cols)
writer.format("parquet").saveAsTable(f"{database}.{table}")
```

## Backward Compatibility
- All existing interfaces maintained
- Strategy pattern unchanged
- Configuration processing unchanged
- Returns lists of DataFrames to maintain API compatibility

## Validation
- All existing tests updated and passing
- No changes required to job configuration
- Maintains all existing ETL logic and transformations
- Error handling improved with native Spark exceptions