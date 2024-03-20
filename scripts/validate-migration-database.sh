#!/bin/bash -e

DATABASE=$1

if [ -z "$DATABASE" ]; then
  echo "Database not provided"
  echo "Usage: validate-database.sh [-d] DATABASE"
  exit 1
fi

VALID_DATABASES=$(find redshift-scripts/flyway/migrations -type d -mindepth 1 -maxdepth 1 -exec basename {} \;)

for dir in $VALID_DATABASES; do
  if [ "${DATABASE}" == "${dir}" ]; then
    exit 0
  fi
done

echo "Invalid database: \"$DATABASE\""
exit 1
