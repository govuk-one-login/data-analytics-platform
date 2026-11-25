{#
  Access check - tries to create a table in a schema owned by the DAP pipeline.
  Expected result: "permission denied for schema conformed_refactored".
  Usage: dbt run-operation check_write_blocked
#}
{% macro check_write_blocked() %}
  {% do run_query("create table conformed_refactored.dbt_should_fail (id int)") %}
{% endmacro %}
