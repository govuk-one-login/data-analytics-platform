#!/usr/bin/env bash
# Detect and fix IAM role policy drift after CloudFormation stack import.
#
# CloudFormation import does not restore inline policies on retained IAM roles.
# This script extracts expected policies from the deployed template and applies them.
#
# Usage: ./scripts/recovery/dev/fix-iam-policy-drift.sh <stack-name> <environment>

set -euo pipefail

export AWS_PAGER=""

STACK_NAME="${1:?Usage: $0 <stack-name> <environment>}"
ENVIRONMENT="${2:?Usage: $0 <stack-name> <environment>}"
REGION="${AWS_REGION:-eu-west-2}"
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text --region "$REGION")

echo "====| Detect and fix IAM role policy drift |===="
echo "----| Stack: $STACK_NAME | Environment: $ENVIRONMENT | Account: $ACCOUNT_ID"

RECOVER_STACK_NAME="$STACK_NAME" RECOVER_REGION="$REGION" RECOVER_ENVIRONMENT="$ENVIRONMENT" RECOVER_ACCOUNT_ID="$ACCOUNT_ID" python3 << 'PYEOF'
import json, re, subprocess, sys, os

STACK_NAME = os.environ["RECOVER_STACK_NAME"]
REGION = os.environ["RECOVER_REGION"]
ENVIRONMENT = os.environ["RECOVER_ENVIRONMENT"]
ACCOUNT_ID = os.environ["RECOVER_ACCOUNT_ID"]

result = subprocess.run(
    ["aws", "cloudformation", "get-template", "--stack-name", STACK_NAME,
     "--region", REGION, "--output", "json"],
    capture_output=True, text=True
)
if result.returncode != 0:
    print("----|  ERROR: Could not get stack template")
    sys.exit(1)

template = json.loads(result.stdout)["TemplateBody"]
resources = template.get("Resources", {})

def resolve_sub(value):
    if isinstance(value, str):
        return value
    if isinstance(value, dict):
        if "Fn::Sub" in value:
            s = value["Fn::Sub"]
            if isinstance(s, str):
                return (s.replace("${Environment}", ENVIRONMENT)
                         .replace("${AWS::AccountId}", ACCOUNT_ID)
                         .replace("${AWS::Region}", REGION)
                         .replace("${AWS::StackName}", STACK_NAME))
        if "Ref" in value:
            ref = value["Ref"]
            if ref == "Environment": return ENVIRONMENT
            if ref == "AWS::AccountId": return ACCOUNT_ID
            if ref == "AWS::Region": return REGION
            if ref in resources:
                ref_props = resources[ref].get("Properties", {})
                for key in ["BucketName", "QueueName", "Name"]:
                    if key in ref_props:
                        return resolve_sub(ref_props[key])
            return ref
    return json.dumps(value)

def resolve_logical_ref(logical_id):
    """Resolve a CloudFormation logical resource ID to its physical name."""
    if logical_id in resources:
        ref_props = resources[logical_id].get("Properties", {})
        for key in ["BucketName", "QueueName", "Name", "RoleName", "FunctionName"]:
            if key in ref_props:
                return resolve_sub(ref_props[key])
    return logical_id

def resolve_sub_string(s):
    """Resolve all ${...} references in a Fn::Sub string."""
    result = (s.replace("${Environment}", ENVIRONMENT)
               .replace("${AWS::AccountId}", ACCOUNT_ID)
               .replace("${AWS::Region}", REGION)
               .replace("${AWS::StackName}", STACK_NAME))
    for match in re.findall(r'\$\{([^}]+)\}', result):
        if match in resources:
            result = result.replace("${" + match + "}", resolve_logical_ref(match))
    return result

def resolve_resource(value):
    if isinstance(value, str):
        return resolve_sub_string(value)
    if isinstance(value, list):
        return [resolve_resource(v) for v in value]
    if isinstance(value, dict):
        if "Fn::Sub" in value:
            s = value["Fn::Sub"]
            if isinstance(s, str):
                return resolve_sub_string(s)
            if isinstance(s, list):
                r = resolve_sub_string(s[0])
                for k, v in (s[1] if len(s) > 1 else {}).items():
                    r = r.replace("${" + k + "}", resolve_resource(v))
                return r
        if "Ref" in value:
            return resolve_sub(value)
        if "Fn::GetAtt" in value:
            return "arn:placeholder:" + str(value["Fn::GetAtt"])
        return {k: resolve_resource(v) for k, v in value.items()}
    return value

fixed = 0
for logical_id, resource in resources.items():
    if resource.get("Type") != "AWS::IAM::Role":
        continue
    if resource.get("DeletionPolicy") != "Retain":
        continue
    props = resource.get("Properties", {})
    expected_policies = props.get("Policies", [])
    if not expected_policies:
        continue
    role_name = resolve_sub(props.get("RoleName", ""))
    if not role_name:
        continue

    check = subprocess.run(
        ["aws", "iam", "list-role-policies", "--role-name", role_name,
         "--output", "json"],
        capture_output=True, text=True
    )
    if check.returncode != 0:
        continue
    existing_policies = set(json.loads(check.stdout).get("PolicyNames", []))

    for policy in expected_policies:
        policy_name = resolve_sub(policy.get("PolicyName", ""))
        if not policy_name or policy_name in existing_policies:
            continue
        policy_doc = resolve_resource(policy.get("PolicyDocument", {}))
        if not policy_doc:
            continue
        print(f"----|  Fixing: {role_name} — missing policy: {policy_name}")
        put_result = subprocess.run(
            ["aws", "iam", "put-role-policy", "--role-name", role_name,
             "--policy-name", policy_name, "--policy-document", json.dumps(policy_doc)],
            capture_output=True, text=True
        )
        if put_result.returncode == 0:
            print(f"----|    Applied: {policy_name}")
            fixed += 1
        else:
            print(f"----|    ERROR applying {policy_name}: {put_result.stderr.strip()}")

if fixed == 0:
    print("----|  All retained IAM roles have correct policies.")
else:
    print(f"----|  Fixed {fixed} policy/policies across drifted roles.")
PYEOF
