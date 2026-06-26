#!/usr/bin/env bash
# Shared import functions for stack recovery.
# Source this file — do not execute directly.
#
# Required environment variables:
#   STACK_NAME, ENVIRONMENT, REGION, APPLICATION, TEMPLATE_BUCKET, PACKAGED_FILE

upload_template() {
  local file="$1" name="$2"
  local key="recover-stack/$APPLICATION/${name}-$(date +%s).yaml"
  aws s3 cp "$file" "s3://$TEMPLATE_BUCKET/$key" --region "$REGION" > /dev/null
  echo "https://$TEMPLATE_BUCKET.s3.$REGION.amazonaws.com/$key"
}

import_resources() {
  local template_url="$1" json_file="$2" changeset_name="$3"
  local count
  count=$(python3 -c "import json; print(len(json.load(open('$json_file'))))")
  if [[ "$count" == "0" ]]; then
    echo "----|  No resources to import, skipping."
    return 0
  fi
  echo "----|  Importing $count resources..."
  aws cloudformation delete-change-set \
    --stack-name "$STACK_NAME" --change-set-name "$changeset_name" \
    --region "$REGION" 2> /dev/null || true
  aws cloudformation create-change-set \
    --stack-name "$STACK_NAME" --change-set-name "$changeset_name" \
    --change-set-type IMPORT --template-url "$template_url" \
    --resources-to-import "file://$json_file" \
    --parameters "ParameterKey=Environment,ParameterValue=$ENVIRONMENT" \
    --capabilities CAPABILITY_NAMED_IAM CAPABILITY_AUTO_EXPAND \
    --region "$REGION" > /dev/null
  echo "----|  Waiting for changeset..."
  if ! aws cloudformation wait change-set-create-complete \
    --stack-name "$STACK_NAME" --change-set-name "$changeset_name" --region "$REGION" 2> /dev/null; then
    echo "----| ERROR: Changeset failed:"
    aws cloudformation describe-change-set --stack-name "$STACK_NAME" \
      --change-set-name "$changeset_name" --region "$REGION" \
      --query "StatusReason" --output text
    return 1
  fi
  echo "----|  Executing..."
  aws cloudformation execute-change-set \
    --stack-name "$STACK_NAME" --change-set-name "$changeset_name" --region "$REGION"
  if ! aws cloudformation wait stack-import-complete --stack-name "$STACK_NAME" --region "$REGION"; then
    echo "----| ERROR: Import failed. Stack is likely in IMPORT_ROLLBACK_COMPLETE state."
    return 1
  fi
  echo "----|  Done."
}

generate_import_template() {
  local ids_json="$1" output="$2"
  python3 << PYEOF
import json, re

include_ids = set(json.load(open('$ids_json')))
template = open('$PACKAGED_FILE').read()
lines = template.split('\n')
res_idx = lines.index('Resources:')

blocks = {}
current_id = None
current_lines = []
for line in lines[res_idx + 1:]:
    m = re.match(r'^  ([A-Za-z]\w+):$', line)
    if m:
        if current_id: blocks[current_id] = current_lines
        current_id = m.group(1)
        current_lines = [line]
    elif line and not line[0].isspace():
        if current_id: blocks[current_id] = current_lines
        break
    elif current_id:
        current_lines.append(line)
if current_id and current_id not in blocks:
    blocks[current_id] = current_lines

included_blocks = {k: v for k, v in blocks.items() if k in include_ids}
non_included_ids = set(blocks.keys()) - include_ids

def strip_section(text, section_name):
    result = []
    in_section = False
    for line in text.split('\n'):
        if line.startswith(section_name + ':'):
            in_section = True; continue
        if in_section and line and line[0].isalpha():
            in_section = False
        if not in_section: result.append(line)
    return '\n'.join(result)

header = '\n'.join(lines[:res_idx])
for s in ['Transform', 'Globals', 'Outputs']:
    header = strip_section(header, s)

resource_section = '\n'.join('\n'.join(v) for v in included_blocks.values())
for rid in non_included_ids:
    resource_section = re.sub(rf'!GetAtt {rid}\.\w+', "'placeholder'", resource_section)
    resource_section = re.sub(rf'!Ref {rid}\b', "'placeholder'", resource_section)
    resource_section = re.sub(rf'Fn::GetAtt:\n(\s+)- {rid}\n\s+- \w+', "'placeholder'", resource_section)
    resource_section = re.sub(rf'- Fn::GetAtt:\n(\s+)- {rid}\n\s+- \w+', "- 'placeholder'", resource_section)
    resource_section = re.sub(rf'Ref:\s*{rid}\b', "'placeholder'", resource_section)

open('$output', 'w').write(header + '\nResources:\n' + resource_section + '\n')
print(f'----|  Generated template with {len(included_blocks)} resources')
PYEOF
}
