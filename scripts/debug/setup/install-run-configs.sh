#!/bin/bash
# Sets up local debug run configurations.
# Usage: bash scripts/debug/setup/install-run-configs.sh [vscode|intellij]
# Omit the argument to run both.

set -e
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
IDE="${1:-all}"

setup_vscode() {
  local VSCODE_DIR="$ROOT_DIR/.vscode"
  mkdir -p "$VSCODE_DIR"
  local CONFIGS=""
  for d in "$ROOT_DIR/src/handlers/"/*/; do
    local HANDLER
    HANDLER=$(basename "$d")
    CONFIGS="${CONFIGS}
    {
      \"name\": \"Debug ${HANDLER}\",
      \"type\": \"node\",
      \"request\": \"launch\",
      \"runtimeExecutable\": \"\${workspaceFolder}/node_modules/.bin/ts-node\",
      \"args\": [\"\${workspaceFolder}/scripts/debug/invoke-local.ts\", \"${HANDLER}\"],
      \"cwd\": \"\${workspaceFolder}\",
      \"sourceMaps\": true,
      \"skipFiles\": [\"<node_internals>/**\", \"**/node_modules/**\"]
    },"
  done
  CONFIGS="${CONFIGS%,}"
  cat > "$VSCODE_DIR/launch.json" << EOF
{
  "version": "0.2.0",
  "configurations": [${CONFIGS}
  ]
}
EOF
  echo "==> Generated $VSCODE_DIR/launch.json"
}

setup_intellij() {
  echo ""
  echo "==> IntelliJ: create a Node.js run configuration manually for each Lambda:"
  echo ""
  echo "   Run > Edit Configurations > + > Node.js"
  echo ""
  echo "   Node interpreter : <your Node 22 path>"
  echo "   Node parameters  : --require ts-node/register"
  echo "   Working directory: $ROOT_DIR"
  echo "   JavaScript file  : $ROOT_DIR/scripts/debug/invoke-local.ts"
  echo "   App parameters   : <handlerName>  e.g. s3-send-metadata"
  echo ""
  echo "   Available handlers:"
  for d in "$ROOT_DIR/src/handlers/"/*/; do
    echo "     - $(basename "$d")"
  done
  echo ""
}

case "$IDE" in
  vscode) setup_vscode ;;
  intellij) setup_intellij ;;
  all)
    setup_vscode
    setup_intellij
    ;;
  *)
    echo "Usage: $0 [vscode|intellij]"
    exit 1
    ;;
esac
