# Local dbt access to production-preview Redshift

Developers can run dbt from a local machine against the production-preview Redshift Serverless workgroup. Production-preview holds no production data, but it has the same size and behaviour as production.

The dbt project, the connect script and the developer guide are in the [firebreak-dbt-adm-pilot](https://github.com/govuk-one-login/firebreak-dbt-adm-pilot) repo. See its `docs/local-redshift-access.md` for how to set up and connect.

This repo holds the infrastructure and database access that make this possible. This page covers what exists and the admin tasks that go with it.

## How it works

```
local machine (dbt)
  └─ localhost:5439
       └─ SSM port forwarding session (document: production-preview-dap-redshift-port-forward)
            └─ bastion EC2 instance (private subnet, no inbound access, no SSH)
                 └─ production-preview-redshift-serverless-workgroup:5439
```

- The workgroup isn't publicly accessible. The only way in is an SSM Session Manager tunnel through a bastion in the DAP VPC.
- Developers assume the IAM role `production-preview-dap-dbt-developer-role`. Only the TEAM-approved SSO roles (`ApprovedReadOnly`, `ApprovedPowerUser`, `ApprovedAdmin`) can assume it. The standing `ViewOnlyAccessPermission` role can't.
- dbt authenticates with IAM. It calls `redshift-serverless:GetCredentials`, which maps the role to the database user `IAMR:production-preview-dap-dbt-developer-role`. The admin secret isn't involved.

| Access | Schemas |
|---|---|
| Read only | `conformed_refactored`, `presentation_refactored`, `reference_data` |
| Can create schemas | anywhere in `dap_txma_reporting_db_refactored`, by convention `dbt_<name>` |
| No access | everything else, for example `audit_refactored` and `analytical_data_model` |

## Where it's defined

| What | Where |
|---|---|
| Bastion, its instance profile and launch template, the port forwarding session document, and the developer role | [`iac/main/resources/dbt-access.yml`](../iac/main/resources/dbt-access.yml). Everything is conditional on `IsProductionPreview`. |
| Database user, `dap_dbt_developers` group, grants and the 30 minute `statement_timeout` | [`redshift-scripts/setup_process_refactored/redshift_dbt_access_setup.sql`](../redshift-scripts/setup_process_refactored/redshift_dbt_access_setup.sql). This is a manual, one-off script, not a flyway migration, because the user and group only exist in production-preview. |

The developer role allows only:

- `ssm:StartSession` on the bastion, using the port forwarding session document
- `ssm:TerminateSession` and `ssm:ResumeSession` on the caller's own sessions
- `redshift-serverless:GetCredentials` on the workgroup

## Admin tasks

### After the Redshift namespace is recreated

Run [`redshift_dbt_access_setup.sql`](../redshift-scripts/setup_process_refactored/redshift_dbt_access_setup.sql) again as `admin`, connected to `dap_txma_reporting_db_refactored`, with `{env}` replaced by `production-preview`. This applies, for example, after following [the stack recovery runbook](runbooks/stack-recovery.md). The script ends with a commented-out block that removes all of the access.

### Granting access to another schema

Add the grants for `dap_dbt_developers` to `redshift_dbt_access_setup.sql`, then run just the new statements as `admin`. The grants are only applied by hand, so the file is the record of what has been granted.

### Checks

Run these from the Redshift query editor as `admin`, connected to `dap_txma_reporting_db_refactored`.

```sql
-- the dbt user and group exist
select g.groname, u.usename
from pg_group g
join pg_user u on u.usesysid = any(g.grolist)
where g.groname = 'dap_dbt_developers';

-- the dbt user's session settings (statement_timeout)
select usename, useconfig from pg_user where usename = 'IAMR:production-preview-dap-dbt-developer-role';

-- what the dbt user can do on each schema
select s.schema_name,
       has_schema_privilege('IAMR:production-preview-dap-dbt-developer-role', s.schema_name, 'usage')  as can_use,
       has_schema_privilege('IAMR:production-preview-dap-dbt-developer-role', s.schema_name, 'create') as can_create
from (select 'conformed_refactored' as schema_name
      union all select 'presentation_refactored'
      union all select 'reference_data'
      union all select 'audit_refactored') s;

-- schemas created by dbt. The connect script drops these at the end of each session, so anything long-lived here
-- was left by someone who didn't use it, or used --keep-schema
select nspname as schema_name, usename as owner
from pg_namespace n
join pg_user u on u.usesysid = n.nspowner
where nspname like 'dbt\\_%';

-- queries currently running as the dbt user
select query_id, start_time, status, left(query_text, 100) as query
from sys_query_history
where user_id = (select usesysid from pg_user where usename = 'IAMR:production-preview-dap-dbt-developer-role')
  and status = 'running';
```

The AWS side, using an SSO profile for the production-preview account:

```sh
BASTION_ID=$(aws cloudformation describe-stack-resource --profile dap-production-preview --region eu-west-2 \
  --stack-name dap --logical-resource-id DbtBastionInstance \
  --query StackResourceDetail.PhysicalResourceId --output text)

# the bastion is registered with SSM ("Online")
aws ssm describe-instance-information --profile dap-production-preview --region eu-west-2 \
  --filters "Key=InstanceIds,Values=$BASTION_ID" --query 'InstanceInformationList[].[InstanceId,PingStatus]' --output text

# the session document is the current version (its content should contain "LocalPortForwarding")
aws ssm get-document --name production-preview-dap-redshift-port-forward \
  --profile dap-production-preview --region eu-west-2 --query Content --output text

# tunnels currently open to the bastion - end any left behind with: aws ssm terminate-session --session-id <id>
aws ssm describe-sessions --state Active --filters key=Target,value="$BASTION_ID" \
  --profile dap-production-preview --region eu-west-2 \
  --query 'Sessions[].[SessionId,Owner,StartDate]' --output text
```

## Things to know when changing the infrastructure

- `DbtPortForwardSessionDocument` has a fixed name and `UpdateMethod: NewVersion`. Without `UpdateMethod`, a change to its content forces a replacement, which fails for a fixed-name resource and rolls the stack back.
- The session document's `type` must be `LocalPortForwarding`. With any other value, sessions start but never open the local port, and no error is shown.
- `redshift-serverless:GetCredentials` only supports the `aws:ResourceTag` condition key. A `redshift-serverless:DbName` condition denies every call.
- The bastion's AMI is resolved from SSM at deploy time, so a deploy can replace the instance. Look up its ID from the stack rather than hard-coding it.
