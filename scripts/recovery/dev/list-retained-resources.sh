#!/usr/bin/env bash
# Lists all CloudFormation resources that have DeletionPolicy: Retain in the IaC templates,
# and optionally queries AWS for their physical resource IDs in a deployed stack.
#
# Usage:
#   ./scripts/recovery/dev/list-retained-resources.sh                    # just list from templates
#   ./scripts/recovery/dev/list-retained-resources.sh --stack STACK_NAME # also query AWS for physical IDs

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"
IAC_DIR="$PROJECT_ROOT/iac"
REGION="${AWS_REGION:-eu-west-2}"
STACK_NAME=""

while [[ $# -gt 0 ]]; do
  case $1 in
    --stack)
      STACK_NAME="$2"
      shift 2
      ;;
    --region)
      REGION="$2"
      shift 2
      ;;
    *)
      echo "Unknown option: $1"
      exit 1
      ;;
  esac
done

echo "----| Scanning templates in: $IAC_DIR"
echo ""

# Parse YAML templates to find resources with DeletionPolicy: Retain
# Output format: file | logical_id | type
find_retained_resources() {
  find "$IAC_DIR" -name '*.yml' -o -name '*.yaml' | sort | while read -r file; do
    # Use awk to parse the YAML structure
    awk '
      /^[A-Za-z]/ && !/^[[:space:]]/ {
        logical_id = $0
        gsub(/:.*/, "", logical_id)
        type = ""
        has_retain = 0
      }
      /^  Type:/ {
        type = $0
        gsub(/.*Type:[[:space:]]*/, "", type)
        gsub(/["\047]/, "", type)
      }
      /^  DeletionPolicy:[[:space:]]*Retain/ {
        has_retain = 1
      }
      /^[A-Za-z]/ && !/^[[:space:]]/ && has_retain && type != "" {
        # Print previous resource if it had Retain
      }
      END {}
    ' "$file" | true # awk approach is fragile for this; use python instead

    # Use a simple python one-liner for reliable YAML-like parsing
    python3 -c "
import sys

logical_id = None
resource_type = None
has_retain = False

with open('$file') as f:
    for line in f:
        stripped = line.rstrip()
        # Top-level resource key (no indentation, ends with colon)
        if stripped and not stripped[0].isspace() and stripped.endswith(':') and not stripped.startswith('#'):
            # Emit previous resource if it had Retain
            if logical_id and has_retain and resource_type:
                print(f'$file|{logical_id}|{resource_type}')
            logical_id = stripped.rstrip(':')
            resource_type = None
            has_retain = False
        elif stripped.startswith('  Type:') and not stripped.startswith('    '):
            resource_type = stripped.split(':', 1)[1].strip().strip(\"'\\\"\")
        elif stripped.strip() == 'DeletionPolicy: Retain' and stripped.startswith('  ') and not stripped.startswith('    '):
            has_retain = True

    # Don't forget the last resource
    if logical_id and has_retain and resource_type:
        print(f'$file|{logical_id}|{resource_type}')
"
  done
}

RESOURCES=$(find_retained_resources)

if [[ -z "$RESOURCES" ]]; then
  echo "----| No resources with DeletionPolicy: Retain found."
  exit 0
fi

# Print header
printf "%-50s %-45s %s\n" "LOGICAL ID" "TYPE" "FILE"
printf "%-50s %-45s %s\n" "----------" "----" "----"

echo "$RESOURCES" | while IFS='|' read -r file logical_id type; do
  rel_file="${file#$PROJECT_ROOT/}"
  printf "%-50s %-45s %s\n" "$logical_id" "$type" "$rel_file"
done

TOTAL=$(echo "$RESOURCES" | wc -l | tr -d ' ')
echo ""
echo "----| Total: $TOTAL resources with DeletionPolicy: Retain"

# If a stack name was provided, query AWS for physical resource IDs
if [[ -n "$STACK_NAME" ]]; then
  echo ""
  echo "----| Querying stack '$STACK_NAME' in $REGION for physical resource IDs..."
  echo ""
  printf "%-50s %-45s %s\n" "LOGICAL ID" "TYPE" "PHYSICAL ID"
  printf "%-50s %-45s %s\n" "----------" "----" "-----------"

  echo "$RESOURCES" | while IFS='|' read -r file logical_id type; do
    physical_id=$(aws cloudformation describe-stack-resource \
      --stack-name "$STACK_NAME" \
      --logical-resource-id "$logical_id" \
      --region "$REGION" \
      --query "StackResourceDetail.PhysicalResourceId" \
      --output text 2> /dev/null || echo "NOT FOUND")
    printf "%-50s %-45s %s\n" "$logical_id" "$type" "$physical_id"
  done
fi
