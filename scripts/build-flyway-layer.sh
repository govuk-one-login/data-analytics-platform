#!/bin/bash -e

ROOT=$(pwd)
LAYER_DIST="$ROOT/layer-dist/flyway"
LAYER_SRC="$ROOT/src/layers/flyway"
BIN_DIR="$LAYER_DIST"/bin
FLYWAY_DIR="$LAYER_DIST"/flyway

rm -rf "$ROOT/layer-dist"
mkdir -p "$BIN_DIR"
mkdir -p "$FLYWAY_DIR"

echo "Building layers/flyway"

cp -R "$LAYER_SRC"/run-flyway "$BIN_DIR"

tar -xzf "$LAYER_SRC"/flyway-commandline-*-linux-x64.tar.gz -C "$FLYWAY_DIR" --strip-components 1

# delete almost everything in drivers/ to reduce the size of the lambda so it will fit within the AWS deployment package limit
# see https://docs.aws.amazon.com/lambda/latest/dg/gettingstarted-limits.html
mv "$FLYWAY_DIR"/drivers/jackson-data*.jar "$LAYER_DIST"
rm -r "$FLYWAY_DIR"/drivers/*
mv "$LAYER_DIST"/jackson-data*.jar "$FLYWAY_DIR"/drivers

# add redshift driver
cp "$LAYER_SRC"/redshift-jdbc*.jar "$FLYWAY_DIR"/drivers

# further reduce package size by deleting a large and apparently unneeded directory from lib/
rm -rf "$FLYWAY_DIR"/lib/rgcompare

# remove jre/legal/ as it is full of broken symlinks that cause sam deploy to exit with an error
rm -rf "$FLYWAY_DIR"/jre/legal

# add migrations
mkdir -p "$FLYWAY_DIR"/sql
cp redshift-scripts/migrations/*.sql "$FLYWAY_DIR"/sql
