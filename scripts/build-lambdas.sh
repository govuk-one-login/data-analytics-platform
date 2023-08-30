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
  esbuild "$srcPath" --bundle --minify --sourcemap --platform=node --target=es2020 --outfile="$DIST/$lambdaName.js" --log-level=warning
done
