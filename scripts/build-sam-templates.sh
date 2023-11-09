#!/bin/bash -e

APP_NAMES=("main" "quicksight-access")

ROOT=$(pwd)
DIST="$ROOT/iac-dist"

rm -rf "$DIST"
mkdir -p "$DIST"

for app in "${APP_NAMES[@]}"; do
  "$ROOT/scripts/build-sam-template.sh" "$app"
  mv "$ROOT/template.yaml" "$DIST/template-$app.yml"
done
