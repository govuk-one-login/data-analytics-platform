#!/usr/bin/env bash
# Build and package the SAM application for stack recovery.
#
# Outputs: $TEMP_DIR/packaged-template.yaml
#
# Usage: ./scripts/recovery/dev/build-and-package.sh <application>
#   application: main | quicksight-access | core

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"
REGION="${AWS_REGION:-eu-west-2}"

APPLICATION="${1:?Usage: $0 <application>}"
TEMP_DIR="$PROJECT_ROOT/temp"
mkdir -p "$TEMP_DIR"

PACKAGED_FILE="$TEMP_DIR/packaged-template.yaml"

cd "$PROJECT_ROOT"
npm run build
npm run iac:build -- "$APPLICATION"
sam build
sam package --region "$REGION" --resolve-s3 --output-template-file "$PACKAGED_FILE"
echo "----| Packaged template: $PACKAGED_FILE"
