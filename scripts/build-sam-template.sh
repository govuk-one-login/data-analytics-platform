#!/bin/bash -e

APP_NAME=$1

if [ -z "$APP_NAME" ] || { [ "$APP_NAME" != "main" ] && [ "$APP_NAME" != "quicksight-access" ]; }; then
  echo "App name must be provided and be one of 'main' or 'quicksight-access'"
  echo "Usage (bash): build-sam-templates.sh APP_NAME"
  echo "Usage (npm): npm run iac:build -- APP_NAME"
  exit 1
fi

ROOT=$(pwd)
IAC_DIR="$ROOT/iac"
BASE_FILE="$IAC_DIR/$APP_NAME/base.yml"
RESOURCE_DIR="$IAC_DIR/$APP_NAME/resources"
OUTFILE="$ROOT/template.yaml"

rm -f "$OUTFILE"

# start the template with the initial section in base.yml, and begin the Resources section
cat "$BASE_FILE" > "$OUTFILE"
echo -e "\nResources:" >> "$OUTFILE"

for file in "$RESOURCE_DIR"/*; do
  sed 's/^/  /' < "$file" >> "$OUTFILE"
  echo >> "$OUTFILE"
done

prettier "$OUTFILE" --write > /dev/null
