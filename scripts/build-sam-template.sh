#!/bin/bash -e

ROOT=$(pwd)
IAC_DIR="$ROOT/iac"
RESOURCE_DIR="$IAC_DIR/resources"
OUTFILE="$ROOT/template.yaml"

rm -f "$OUTFILE"

# start the template with the initial section in base.yml, and begin the Resources section
cat "$IAC_DIR"/base.yml > "$OUTFILE"
echo -e "\nResources:" >> "$OUTFILE"

for file in "$RESOURCE_DIR"/* ; do
  sed 's/^/  /' < "$file" >> "$OUTFILE"
  echo >> "$OUTFILE"
done

prettier "$OUTFILE" --write
