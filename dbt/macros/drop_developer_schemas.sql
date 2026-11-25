{#
  Drops the schemas dbt has built for you: the target schema (dbt_<name>) and any custom schemas dbt has derived from it
  (dbt_<name>_<custom>). Only schemas owned by the connected database user are dropped.
  dbt/connect.sh runs this when a session starts and ends, unless it is run with --keep-schema.
  Usage: dbt run-operation drop_developer_schemas [--args '{dry_run: true}']
#}
{% macro drop_developer_schemas(dry_run=false) %}
  {% set prefix = target.schema | lower %}
  {% if not modules.re.match('^dbt_[a-z0-9]+$', prefix) %}
    {{ exceptions.raise_compiler_error("Refusing to drop schemas for unexpected target schema '" ~ prefix ~ "'") }}
  {% endif %}

  {% set find_schemas %}
    select n.nspname
    from pg_namespace n
    join pg_user u on u.usesysid = n.nspowner
    where u.usename = current_user
      and (n.nspname = '{{ prefix }}' or left(n.nspname, {{ (prefix | length) + 1 }}) = '{{ prefix }}_')
    order by 1
  {% endset %}
  {% set schemas = run_query(find_schemas).columns[0].values() %}

  {% if schemas | length == 0 %}
    {% do log("No schemas to drop for " ~ prefix, info=true) %}
  {% endif %}
  {% for schema in schemas %}
    {% if dry_run %}
      {% do log("Would drop schema " ~ schema, info=true) %}
    {% else %}
      {% do run_query('drop schema if exists "' ~ schema ~ '" cascade') %}
      {% do log("Dropped schema " ~ schema, info=true) %}
    {% endif %}
  {% endfor %}
{% endmacro %}
