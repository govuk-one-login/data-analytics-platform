#!/bin/bash -e

ROOT=$(pwd)
DIST="$ROOT/dist"
SRC="$ROOT/src/handlers"

rm -rf "$DIST"
mkdir -p "$DIST"

for dir in "$SRC"/*; do
  srcPath="${dir}/handler.ts"
  lambdaName="${dir##*/}"
  echo "Building $lambdaName"
  esbuild "$srcPath" --bundle --minify --sourcemap --platform=node --target=es2020 --outfile="$DIST/$lambdaName.js" --log-level=warning \
    --external:better-sqlite3 --external:better-mysql2 --external:mysql* --external:oracledb --external:pg-query-stream --external:sqlite3 --external:tedious
done
