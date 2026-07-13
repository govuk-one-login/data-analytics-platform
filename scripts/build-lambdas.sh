#!/bin/bash -e

ROOT=$(pwd)
DIST="$ROOT/dist"
SRC="$ROOT/src/handlers"

rm -rf "$DIST"
mkdir -p "$DIST"

for dir in "$SRC"/*; do
  srcPath="${dir}/handler.ts"
  lambdaName="${dir##*/}"
  echo "Building handlers/$lambdaName"
  esbuild "$srcPath" --bundle --minify --sourcemap --platform=node --target=node24 --format=esm --main-fields=module,main --outfile="$DIST/$lambdaName.mjs" --log-level=warning \
    --external:better-sqlite3 --external:better-mysql2 --external:mariadb --external:mysql* --external:oracledb --external:pg-query-stream --external:sqlite3 --external:tedious
done
