#!/usr/bin/env bash
#
# Connects to the production-preview Redshift workgroup so dbt can be run locally.
#
#   1. checks the prerequisites (AWS CLI, Session Manager plugin, dbt virtual environment)
#   2. logs in to AWS SSO if needed and checks the session is a TEAM approved one
#   3. checks the dbt AWS profile exists (offers to add it to ~/.aws/config if not)
#   4. opens an SSM port forwarding tunnel to Redshift through the bastion
#   5. runs `dbt debug` to check the connection
#   6. starts a shell in dbt/ with everything set up to run dbt commands
#
# Exiting the shell (`exit` or Ctrl-D) closes the tunnel.
# See docs/dbt-local-access.md for more details.

set -euo pipefail

REGION=eu-west-2
ACCOUNT_ID=339712909359
STACK_NAME=dap
BASTION_LOGICAL_ID=DbtBastionInstance
SESSION_DOCUMENT=production-preview-dap-redshift-port-forward
DBT_AWS_PROFILE=dap-preview-dbt
DBT_ROLE_ARN="arn:aws:iam::${ACCOUNT_ID}:role/production-preview-dap-dbt-developer-role"
APPROVED_PERMISSION_SETS="ApprovedReadOnly ApprovedPowerUser ApprovedAdmin"

SSO_PROFILE="${DAP_SSO_PROFILE:-dap-production-preview}"
PORT="${DBT_TUNNEL_PORT:-5439}"
START_SHELL=true
RUN_CHECK=true
DROP_SCHEMAS=true

DBT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VENV_DIR="$DBT_DIR/.venv"

usage() {
  cat << EOF
Usage: dbt/connect.sh [options]

Opens a tunnel to the production-preview Redshift workgroup and starts a shell ready to run dbt.

Options:
  -p, --port PORT           local port for the tunnel (default: \$DBT_TUNNEL_PORT or 5439)
  -s, --sso-profile NAME    AWS SSO profile for di-data-dap-production-preview (default: \$DAP_SSO_PROFILE or dap-production-preview)
      --no-shell            keep the tunnel open in this terminal instead of starting a shell - run dbt from another terminal
      --skip-check          don't run 'dbt debug' once the tunnel is open
      --keep-schema         don't drop your dbt schemas (dbt_<name>*) when the session starts and ends
  -h, --help                show this help

Environment variables:
  DBT_DEVELOPER_NAME        your name, used for your dbt schema (dbt_<name>). You are asked for it if it isn't set
EOF
}

info() { printf '\033[1;34m==>\033[0m %s\n' "$*"; }
ok() { printf '\033[1;32m ✔\033[0m %s\n' "$*"; }
warn() { printf '\033[1;33m !\033[0m %s\n' "$*" >&2; }
fail() {
  printf '\033[1;31m ✘\033[0m %s\n' "$*" >&2
  exit 1
}
is_interactive() { [ -t 0 ] && [ -t 1 ]; }

while [ $# -gt 0 ]; do
  case "$1" in
    -p | --port)
      PORT="${2:?--port needs a value}"
      shift 2
      ;;
    -s | --sso-profile)
      SSO_PROFILE="${2:?--sso-profile needs a value}"
      shift 2
      ;;
    --no-shell)
      START_SHELL=false
      shift
      ;;
    --skip-check)
      RUN_CHECK=false
      shift
      ;;
    --keep-schema)
      DROP_SCHEMAS=false
      shift
      ;;
    -h | --help)
      usage
      exit 0
      ;;
    *)
      usage >&2
      exit 1
      ;;
  esac
done

[[ "$PORT" =~ ^[0-9]{4,5}$ ]] || fail "Port must be a 4 or 5 digit number, got '$PORT'"

# ---------------------------------------------------------------------------------------------------------------------
info "Checking prerequisites"

command -v aws > /dev/null || fail "The AWS CLI isn't installed - see https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html"

if ! command -v session-manager-plugin > /dev/null; then
  # the standalone bundle described in docs/dbt-local-access.md
  if [ -x "$HOME/.local/sessionmanager/sessionmanager-bundle/bin/session-manager-plugin" ]; then
    export PATH="$HOME/.local/sessionmanager/sessionmanager-bundle/bin:$PATH"
  else
    fail "The Session Manager plugin isn't installed - run 'brew install --cask session-manager-plugin'"
  fi
fi

[ -x "$VENV_DIR/bin/dbt" ] || fail "dbt isn't installed in $VENV_DIR - from the repo root run:
    python3.13 -m venv dbt/.venv && dbt/.venv/bin/pip install -r dbt/requirements.txt"

if [ -z "${DBT_DEVELOPER_NAME:-}" ]; then
  is_interactive || fail "DBT_DEVELOPER_NAME isn't set"
  read -r -p "    Your name for your dbt schema (letters and digits only, e.g. jsmith): " DBT_DEVELOPER_NAME
fi
# no underscores, so one developer's schemas (dbt_<name>_*) can never match another developer's name
[[ "$DBT_DEVELOPER_NAME" =~ ^[A-Za-z0-9]+$ ]] || fail "DBT_DEVELOPER_NAME can only contain letters and digits, got '$DBT_DEVELOPER_NAME'"
DBT_SCHEMA="dbt_$(printf '%s' "$DBT_DEVELOPER_NAME" | tr '[:upper:]' '[:lower:]')"
export DBT_DEVELOPER_NAME

ok "AWS CLI, Session Manager plugin and dbt found (your schema will be $DBT_SCHEMA)"

# ---------------------------------------------------------------------------------------------------------------------
info "Checking the AWS SSO session ($SSO_PROFILE)"

PROFILES=$(aws configure list-profiles 2> /dev/null || true)
grep -qx "$SSO_PROFILE" <<< "$PROFILES" \
  || fail "There is no AWS profile called '$SSO_PROFILE' - pass the name of your production-preview SSO profile with --sso-profile"

if ! CALLER_ARN=$(aws sts get-caller-identity --profile "$SSO_PROFILE" --query Arn --output text 2> /dev/null); then
  info "Logging in to AWS SSO"
  aws sso login --profile "$SSO_PROFILE"
  CALLER_ARN=$(aws sts get-caller-identity --profile "$SSO_PROFILE" --query Arn --output text) || fail "Still not logged in to '$SSO_PROFILE'"
fi

case "$CALLER_ARN" in
  "arn:aws:sts::${ACCOUNT_ID}:"*) ;;
  *) fail "Profile '$SSO_PROFILE' is for the wrong account ($CALLER_ARN) - it should be di-data-dap-production-preview ($ACCOUNT_ID)" ;;
esac

PERMISSION_SET=$(printf '%s' "$CALLER_ARN" | sed -n 's|.*assumed-role/AWSReservedSSO_\(.*\)_[0-9a-f]*/.*|\1|p')
case " $APPROVED_PERMISSION_SETS " in
  *" $PERMISSION_SET "*) ok "Logged in as $PERMISSION_SET" ;;
  *) fail "Profile '$SSO_PROFILE' uses the '${PERMISSION_SET:-unknown}' permission set, which can't use the dbt role.
    Request ApprovedReadOnly for di-data-dap-production-preview in TEAM, make sure the profile's sso_role_name
    matches it, then run 'aws sso login --profile $SSO_PROFILE' and try again" ;;
esac

# ---------------------------------------------------------------------------------------------------------------------
info "Checking the dbt AWS profile ($DBT_AWS_PROFILE)"

CONFIGURED_ROLE=$(aws configure get role_arn --profile "$DBT_AWS_PROFILE" 2> /dev/null || true)
if [ -z "$CONFIGURED_ROLE" ]; then
  is_interactive || fail "There is no '$DBT_AWS_PROFILE' profile in your AWS config - see docs/dbt-local-access.md"
  read -r -p "    There is no '$DBT_AWS_PROFILE' profile in your AWS config. Add it now? [y/N] " ANSWER
  case "$ANSWER" in
    y | Y | yes | YES)
      aws configure set role_arn "$DBT_ROLE_ARN" --profile "$DBT_AWS_PROFILE"
      aws configure set source_profile "$SSO_PROFILE" --profile "$DBT_AWS_PROFILE"
      aws configure set region "$REGION" --profile "$DBT_AWS_PROFILE"
      ok "Added '$DBT_AWS_PROFILE' to your AWS config"
      ;;
    *) fail "The '$DBT_AWS_PROFILE' profile is needed - see docs/dbt-local-access.md" ;;
  esac
elif [ "$CONFIGURED_ROLE" != "$DBT_ROLE_ARN" ]; then
  warn "Profile '$DBT_AWS_PROFILE' has role_arn $CONFIGURED_ROLE, expected $DBT_ROLE_ARN"
fi

DBT_CALLER_ARN=$(aws sts get-caller-identity --profile "$DBT_AWS_PROFILE" --query Arn --output text 2>&1) \
  || fail "Couldn't assume the dbt role with profile '$DBT_AWS_PROFILE': $DBT_CALLER_ARN"
ok "Assumed $(printf '%s' "$DBT_CALLER_ARN" | sed 's|.*assumed-role/||')"

# ---------------------------------------------------------------------------------------------------------------------
info "Finding the bastion"

BASTION_ID=$(aws cloudformation describe-stack-resource --profile "$SSO_PROFILE" --region "$REGION" \
  --stack-name "$STACK_NAME" --logical-resource-id "$BASTION_LOGICAL_ID" \
  --query StackResourceDetail.PhysicalResourceId --output text 2> /dev/null) \
  || fail "Couldn't find $BASTION_LOGICAL_ID in the '$STACK_NAME' stack"

PING_STATUS=$(aws ssm describe-instance-information --profile "$SSO_PROFILE" --region "$REGION" \
  --filters "Key=InstanceIds,Values=$BASTION_ID" --query 'InstanceInformationList[0].PingStatus' --output text 2> /dev/null || true)
case "$PING_STATUS" in
  Online) ok "Bastion $BASTION_ID is online" ;;
  None | "") fail "Bastion $BASTION_ID isn't registered with Session Manager - check it is running" ;;
  *) fail "Bastion $BASTION_ID has Session Manager status '$PING_STATUS'" ;;
esac

# ---------------------------------------------------------------------------------------------------------------------
info "Opening the tunnel on localhost:$PORT"

if lsof -nP -iTCP:"$PORT" -sTCP:LISTEN > /dev/null 2>&1; then
  fail "Port $PORT is already in use. If it's an old tunnel, close it, or use another port with --port"
fi

WORK_DIR=$(mktemp -d "${TMPDIR:-/tmp}/dap-dbt.XXXXXX")
TUNNEL_LOG="$WORK_DIR/tunnel.log"
TUNNEL_PID=""
SESSION_ID=""
TUNNEL_OPEN=false

# drops dbt_<name> and dbt_<name>_* through the tunnel, using the drop_developer_schemas macro
drop_schemas() {
  (cd "$DBT_DIR" && "$VENV_DIR/bin/dbt" --no-use-colors run-operation drop_developer_schemas > "$WORK_DIR/drop.log" 2>&1) || return 1
  grep -oE '(Dropped schema|No schemas to drop).*' "$WORK_DIR/drop.log" | sed 's/^/    /' || true
}

cleanup() {
  # keep going if anything fails (e.g. the terminal has been closed) so the tunnel is always closed
  set +e
  trap - EXIT INT TERM HUP
  if [ "$DROP_SCHEMAS" = true ] && [ "$TUNNEL_OPEN" = true ] && kill -0 "$TUNNEL_PID" 2> /dev/null; then
    info "Dropping your dbt schemas (use --keep-schema to keep them)"
    drop_schemas || warn "Couldn't drop your dbt schemas - drop them next time with: dbt run-operation drop_developer_schemas"
  fi
  if [ -n "$TUNNEL_PID" ] && kill -0 "$TUNNEL_PID" 2> /dev/null; then
    info "Closing the tunnel"
    pkill -P "$TUNNEL_PID" 2> /dev/null || true
    kill "$TUNNEL_PID" 2> /dev/null || true
    wait "$TUNNEL_PID" 2> /dev/null || true
  fi
  if [ -n "$SESSION_ID" ]; then
    aws ssm terminate-session --profile "$DBT_AWS_PROFILE" --region "$REGION" --session-id "$SESSION_ID" > /dev/null 2>&1 \
      && ok "Session $SESSION_ID ended" \
      || warn "Couldn't end session $SESSION_ID - it will time out on its own"
  fi
  rm -rf "$WORK_DIR"
}
trap cleanup EXIT
trap 'exit 130' INT TERM
trap 'exit 129' HUP

aws ssm start-session --profile "$DBT_AWS_PROFILE" --region "$REGION" --target "$BASTION_ID" \
  --document-name "$SESSION_DOCUMENT" --parameters "localPortNumber=$PORT" < /dev/null > "$TUNNEL_LOG" 2>&1 &
TUNNEL_PID=$!

for _ in $(seq 1 30); do
  SESSION_ID=$(sed -n 's/^Starting session with SessionId: \([^[:space:]]*\).*$/\1/p' "$TUNNEL_LOG")
  grep -q "Port $PORT opened" "$TUNNEL_LOG" && break
  kill -0 "$TUNNEL_PID" 2> /dev/null || fail "The tunnel failed to start:
$(cat "$TUNNEL_LOG")"
  sleep 1
done
grep -q "Port $PORT opened" "$TUNNEL_LOG" || fail "The tunnel didn't open within 30 seconds:
$(cat "$TUNNEL_LOG")"
TUNNEL_OPEN=true
ok "Tunnel open (session $SESSION_ID)"

export AWS_PROFILE="$DBT_AWS_PROFILE" AWS_REGION="$REGION" DBT_TUNNEL_PORT="$PORT"

# ---------------------------------------------------------------------------------------------------------------------
if [ "$RUN_CHECK" = true ]; then
  info "Checking the dbt connection"
  if (cd "$DBT_DIR" && "$VENV_DIR/bin/dbt" debug --no-use-colors > "$WORK_DIR/dbt-debug.log" 2>&1); then
    ok "dbt debug passed"
  else
    tail -15 "$WORK_DIR/dbt-debug.log" >&2
    fail "dbt debug failed - see the output above and the troubleshooting section of docs/dbt-local-access.md"
  fi
fi

# start from a clean slate - removes schemas left over from a session that didn't close cleanly
if [ "$DROP_SCHEMAS" = true ]; then
  info "Dropping any dbt schemas left from earlier sessions (use --keep-schema to keep them)"
  drop_schemas || fail "Couldn't drop your dbt schemas:
$(tail -15 "$WORK_DIR/drop.log")"
fi

# ---------------------------------------------------------------------------------------------------------------------
cat << EOF

  Connected to production-preview Redshift through localhost:$PORT
    AWS_PROFILE=$AWS_PROFILE  schema=$DBT_SCHEMA

EOF

if [ "$START_SHELL" = false ]; then
  cat << EOF
  In another terminal, run:

    cd $DBT_DIR && source .venv/bin/activate
    export AWS_PROFILE=$AWS_PROFILE DBT_TUNNEL_PORT=$PORT DBT_DEVELOPER_NAME=$DBT_DEVELOPER_NAME
    dbt debug

  Press Ctrl-C here to close the tunnel.
EOF
  wait "$TUNNEL_PID" || true
  exit 0
fi

cat << EOF
  Starting a shell in dbt/ - run dbt commands here, e.g. 'dbt run'.
  Type 'exit' or press Ctrl-D to close the tunnel.

EOF

# the shell's own startup files can change PATH, so activate the virtual environment after they have run.
# Ctrl-C in the shell (e.g. to stop a dbt command) must not reach this script and close the tunnel. A no-op handler is
# used rather than ignoring the signal, as an ignored signal would also be ignored by dbt and everything else in the shell
trap ':' INT
USER_SHELL="${SHELL:-/bin/bash}"
cd "$DBT_DIR"
case "$(basename "$USER_SHELL")" in
  zsh)
    # zsh reads .zshenv and .zshrc from ZDOTDIR - these load the user's own files first
    cat > "$WORK_DIR/.zshenv" << EOF
[ -f "\${DAP_DBT_ORIGINAL_ZDOTDIR:-\$HOME}/.zshenv" ] && source "\${DAP_DBT_ORIGINAL_ZDOTDIR:-\$HOME}/.zshenv"
EOF
    cat > "$WORK_DIR/.zshrc" << EOF
ZDOTDIR="\${DAP_DBT_ORIGINAL_ZDOTDIR:-\$HOME}"
[ -f "\$ZDOTDIR/.zshrc" ] && source "\$ZDOTDIR/.zshrc"
source "$VENV_DIR/bin/activate"
EOF
    DAP_DBT_ORIGINAL_ZDOTDIR="${ZDOTDIR:-}" ZDOTDIR="$WORK_DIR" "$USER_SHELL" -i || true
    ;;
  bash)
    cat > "$WORK_DIR/bashrc" << EOF
[ -f "\$HOME/.bashrc" ] && source "\$HOME/.bashrc"
source "$VENV_DIR/bin/activate"
EOF
    "$USER_SHELL" --rcfile "$WORK_DIR/bashrc" -i || true
    ;;
  *)
    VIRTUAL_ENV="$VENV_DIR" PATH="$VENV_DIR/bin:$PATH" "$USER_SHELL" -i || true
    ;;
esac
