#!/bin/bash -e

# note the docker command in this script will not work on mac or windows (even without the github.workspace references)
# this is because it uses the docker host network driver which only works on linux - see https://docs.docker.com/network/drivers/host

WORKGROUP_NAME=$1
FLYWAY_COMMAND=$2

if [ -z "$WORKGROUP_NAME" ] || [ -z "$FLYWAY_COMMAND" ]; then
  echo "Workgroup name and/or flyway command not provided"
  echo "Usage: run-flyway.sh WORKGROUP_NAME FLYWAY_COMMAND"
  exit 1
fi

HOST=$(aws redshift-serverless get-workgroup --workgroup-name "$WORKGROUP_NAME" --output text --query 'workgroup.endpoint.address')
PORT=$(aws redshift-serverless get-workgroup --workgroup-name "$WORKGROUP_NAME" --output text --query 'workgroup.endpoint.port')

SECRET_ID=$(aws secretsmanager list-secrets --filters '{"Key": "name", "Values": ["MyRedshiftSecret"]}' --output text --query 'SecretList[0].Name')
SECRET_JSON=$(aws secretsmanager get-secret-value --secret-id "$SECRET_ID" --output text --query 'SecretString')
USERNAME=$(echo "$SECRET_JSON" | jq -r '.username')
PASSWORD=$(echo "$SECRET_JSON" | jq -r '.password')

EC2_INSTANCE_ID=$(aws ec2 describe-instances \
  --filters 'Name=tag:aws:cloudformation:logical-id,Values=RedshiftAccessEC2' \
  --output text --query 'Reservations[*].Instances[*].InstanceId')

aws --region eu-west-2 ssm start-session --target "$EC2_INSTANCE_ID" \
  --document-name AWS-StartPortForwardingSessionToRemoteHost \
  --parameters "{\"host\": [\"$HOST\"], \"portNumber\": [\"$PORT\"], \"localPortNumber\": [\"$PORT\"]}" &

docker run --rm \
  --network=host \
  --volume "$GITHUB_WORKSPACE/redshift-scripts/migrations:/flyway/sql:ro" \
  --volume "$GITHUB_WORKSPACE/redshift-scripts/drivers:/flyway/drivers" \
  --env "FLYWAY_PASSWORD=$PASSWORD" \
  redgate/flyway \
  -url="jdbc:redshift://127.0.0.1:$PORT/dap_txma_reporting_db" \
  -user="$USERNAME" \
  "$FLYWAY_COMMAND"
