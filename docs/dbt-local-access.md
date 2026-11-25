# Running dbt locally against production-preview Redshift

This guide covers how to connect dbt on a local machine to the production-preview Redshift Serverless workgroup. Production-preview holds no production data, but it has the same size and behaviour as production, so you can test dbt models at scale.

## How it works

```
local machine (dbt)
  └─ localhost:5439
       └─ SSM port forwarding session (document: production-preview-dap-redshift-port-forward)
            └─ bastion EC2 instance (private subnet, no inbound access, no SSH)
                 └─ production-preview-redshift-serverless-workgroup:5439
```

- The Redshift workgroup isn't publicly accessible. The only way in is an SSM Session Manager tunnel through a bastion in the DAP VPC.
- Authentication uses IAM. dbt calls `redshift-serverless:GetCredentials` to get a temporary database password, so you never need the admin secret.
- You work as the IAM role `production-preview-dap-dbt-developer-role`. Only the TEAM-approved SSO roles (`ApprovedReadOnly`, `ApprovedPowerUser`, `ApprovedAdmin`) can assume it. The standing `ViewOnlyAccessPermission` role can't.
- In Redshift, the role maps to the database user `IAMR:production-preview-dap-dbt-developer-role`, which is a member of the group `dap_dbt_developers`.

| Access | Schemas |
|---|---|
| Read only | `conformed_refactored`, `presentation_refactored`, `reference_data` |
| Can create schemas | anywhere in the database, by convention `dbt_<your_name>` |
| No access | everything else, for example `audit_refactored` |

The resources are defined in [`iac/main/resources/dbt-access.yml`](../iac/main/resources/dbt-access.yml). The database grants come from [`redshift-scripts/setup_process_refactored/redshift_dbt_access_setup.sql`](../redshift-scripts/setup_process_refactored/redshift_dbt_access_setup.sql). All of these exist only in production-preview. The dbt project itself is in [`dbt/`](../dbt).

## One-off setup

### 1. Install the Session Manager plugin

```sh
brew install --cask session-manager-plugin
session-manager-plugin --version
```

The cask asks for your password because it installs with `sudo`. If you can't use `sudo`, download the standalone bundle and add it to your `PATH`:

```sh
mkdir -p ~/.local/sessionmanager && cd ~/.local/sessionmanager
curl -fsSL -o bundle.zip https://s3.amazonaws.com/session-manager-downloads/plugin/latest/mac_arm64/sessionmanager-bundle.zip
unzip -q bundle.zip && rm bundle.zip
export PATH="$HOME/.local/sessionmanager/sessionmanager-bundle/bin:$PATH"   # add this to ~/.zshrc
```

### 2. Install dbt

Install dbt into a virtual environment in the repo's `dbt/` directory. Git ignores `dbt/.venv/`. The versions are pinned in [`dbt/requirements.txt`](../dbt/requirements.txt).

dbt doesn't run on Python 3.14 or later yet. It fails with `mashumaro.exceptions.UnserializableField`, so use Python 3.13. From the repo root:

```sh
brew install python@3.13
python3.13 -m venv dbt/.venv
dbt/.venv/bin/pip install -r dbt/requirements.txt
dbt/.venv/bin/dbt --version
```

### 3. Add an AWS profile for the dbt role

This is the only file you create outside the repo. Add the following to `~/.aws/config`, and set `source_profile` to the name of your existing SSO profile for the `di-data-dap-production-preview` account. If you use the connect script (see [Each session](#each-session)), it offers to add this for you:

```ini
[profile dap-preview-dbt]
role_arn = arn:aws:iam::339712909359:role/production-preview-dap-dbt-developer-role
source_profile = dap-production-preview
region = eu-west-2
```

### 4. The dbt project and profile

You don't need to create any dbt files. The project and its connection profile are already in the repo:

```
dbt/
  connect.sh               # opens the tunnel and starts a shell ready to run dbt
  dbt_project.yml          # project config (profile: dap)
  profiles.yml             # connection profile for production-preview
  requirements.txt         # pinned dbt versions
  models/                  # dbt models go here
  macros/
    check_write_blocked.sql  # access check, see "Checking that everything works"
    drop_developer_schemas.sql  # drops your dbt_<name> schemas, run by connect.sh
  tests/
```

[`dbt/profiles.yml`](../dbt/profiles.yml) is safe to commit because it holds no credentials. dbt gets a temporary database password from `redshift-serverless:GetCredentials`, using the AWS profile in `AWS_PROFILE`. dbt reads `profiles.yml` from the directory it's run in, so always run dbt from `dbt/`. You don't need a `~/.dbt/profiles.yml`. If you already have one, it's ignored while you're in that directory.

The profile reads two environment variables:

| Variable | Required | Purpose |
|---|---|---|
| `DBT_DEVELOPER_NAME` | yes | Your name or username. dbt builds into the schema `dbt_<DBT_DEVELOPER_NAME>`, for example `dbt_jsmith`. Use letters and digits only. Underscores aren't allowed, so one developer's schemas can never be mistaken for another's when schemas are dropped. |
| `DBT_TUNNEL_PORT` | no, default `5439` | The local port of the SSM tunnel |

To avoid setting these every time, add them to `~/.zshrc`:

```sh
export DBT_DEVELOPER_NAME=jsmith
```

`sslmode` in the profile is `require`, not `verify-full`. The connection goes to `localhost`, and the Redshift certificate isn't valid for that hostname. The traffic is still encrypted with TLS.

## Each session

First request `ApprovedReadOnly` for the `di-data-dap-production-preview` account in TEAM, and wait for it to be approved. `ApprovedPowerUser` and `ApprovedAdmin` also work. Your SSO profile's `sso_role_name` must be set to the approved permission set.

Then either use the connect script, which is the easiest option, or follow the manual steps below it.

### Option A: the connect script

From the repo root:

```sh
dbt/connect.sh
```

[`dbt/connect.sh`](../dbt/connect.sh) does the following:

1. Checks that the AWS CLI, the Session Manager plugin and `dbt/.venv` are installed. It asks for `DBT_DEVELOPER_NAME` if it isn't set.
2. Runs `aws sso login` if you aren't logged in. It then checks that the session is for the production-preview account and uses one of the TEAM-approved permission sets.
3. Checks that the `dap-preview-dbt` AWS profile exists, and offers to add it to `~/.aws/config` if it doesn't. It then checks that the dbt role can be assumed.
4. Looks up the bastion and checks that it's online in Session Manager.
5. Opens the tunnel and waits until the local port is ready.
6. Runs `dbt debug` to check the connection.
7. Drops any of your dbt schemas left from an earlier session that didn't close cleanly, so every session starts from a clean slate.
8. Starts a shell in `dbt/` with the virtual environment activated and `AWS_PROFILE`, `DBT_TUNNEL_PORT` and `DBT_DEVELOPER_NAME` set. Run dbt commands in this shell:

   ```sh
   dbt run
   dbt show --inline "select current_user"
   ```

9. When you type `exit` or press Ctrl-D, it drops your dbt schemas, closes the tunnel and ends the SSM session.

If any check fails, the script stops and tells you what to do. Pressing Ctrl-C in the shell stops the running command without closing the tunnel.

| Option | Purpose |
|---|---|
| `-p`, `--port PORT` | Local port for the tunnel. The default is `$DBT_TUNNEL_PORT`, or `5439` if that isn't set. |
| `-s`, `--sso-profile NAME` | Your SSO profile for production-preview. The default is `$DAP_SSO_PROFILE`, or `dap-production-preview` if that isn't set. |
| `--no-shell` | Keeps the tunnel open in the current terminal instead of starting a shell. Run dbt from another terminal, using the commands the script prints. Press Ctrl-C to close the tunnel. |
| `--skip-check` | Skips `dbt debug` |
| `--keep-schema` | Doesn't drop your dbt schemas when the session starts and ends. Use it when you want to carry on with the same models in a later session. Run the script with `--keep-schema` each time until you've finished, then once without it, or drop the schemas yourself (see below). |
| `-h`, `--help` | Shows the options |

### Option B: manual steps

#### 1. Log in

```sh
aws sso login --profile dap-production-preview
aws sts get-caller-identity --profile dap-preview-dbt
```

The second command should return an ARN containing `assumed-role/production-preview-dap-dbt-developer-role/`.

#### 2. Start the tunnel

Run this in its own terminal and leave it open:

```sh
BASTION_ID=$(aws cloudformation describe-stack-resource --profile dap-production-preview --region eu-west-2 \
  --stack-name dap --logical-resource-id DbtBastionInstance \
  --query StackResourceDetail.PhysicalResourceId --output text)

aws ssm start-session --profile dap-preview-dbt --target "$BASTION_ID" \
  --document-name production-preview-dap-redshift-port-forward
```

Wait until you see `Port 5439 opened for sessionId ...` and `Waiting for connections...`. Look up the bastion ID each time, because a deploy can replace the instance with a new one when a new AMI is published.

If port 5439 is already in use locally, choose another port and set `DBT_TUNNEL_PORT` to the same value:

```sh
aws ssm start-session --profile dap-preview-dbt --target "$BASTION_ID" \
  --document-name production-preview-dap-redshift-port-forward --parameters localPortNumber=15439
export DBT_TUNNEL_PORT=15439   # in the terminal you run dbt from
```

#### 3. Run dbt

Open a second terminal and run dbt from the `dbt/` directory, using the repo's virtual environment:

```sh
cd dbt
source .venv/bin/activate
export AWS_PROFILE=dap-preview-dbt
export DBT_DEVELOPER_NAME=jsmith   # unless already set in ~/.zshrc

dbt debug
dbt run
```

When you've finished, drop your schemas while the tunnel is still open:

```sh
dbt run-operation drop_developer_schemas
```

Then press Ctrl-C in the tunnel terminal and end the session. Otherwise it stays active until it times out:

```sh
aws ssm terminate-session --profile dap-preview-dbt --region eu-west-2 --session-id <session id printed when the tunnel started>
```

The role's credentials last up to one hour. Queries are cancelled after 30 minutes.

## Checking that everything works

### AWS side

```sh
# you can assume the dbt role
aws sts get-caller-identity --profile dap-preview-dbt

# the bastion is running and registered with SSM ("Online")
aws ssm describe-instance-information --profile dap-production-preview --region eu-west-2 \
  --query 'InstanceInformationList[].[InstanceId,PingStatus]' --output text

# the dbt role can get database credentials
aws redshift-serverless get-credentials --profile dap-preview-dbt --region eu-west-2 \
  --workgroup-name production-preview-redshift-serverless-workgroup \
  --db-name dap_txma_reporting_db_refactored --duration-seconds 900 --query dbUser --output text

# the tunnel is listening locally
lsof -nP -iTCP:5439 -sTCP:LISTEN
```

### dbt side

Run these in the shell started by `dbt/connect.sh`. If you followed the manual steps instead, run them from the `dbt/` directory, with the virtual environment activated, the tunnel open and `AWS_PROFILE=dap-preview-dbt` set:

```sh
# connection test - should print "All checks passed!"
dbt debug

# which database user you are connected as - should be IAMR:production-preview-dap-dbt-developer-role
dbt show --inline "select current_user as db_user"

# you can read the conformed layer
dbt show --inline "select count(*) as dim_event_rows from conformed_refactored.dim_event_refactored"

# your privileges on each schema
dbt show --inline "
  select s.schema_name,
         has_schema_privilege(current_user, s.schema_name, 'usage')  as can_use,
         has_schema_privilege(current_user, s.schema_name, 'create') as can_create
  from (select 'conformed_refactored' as schema_name
        union all select 'presentation_refactored'
        union all select 'reference_data'
        union all select 'audit_refactored') s"
```

Expected privileges:

| schema_name | can_use | can_create |
|---|---|---|
| conformed_refactored | true | false |
| presentation_refactored | true | false |
| reference_data | true | false |
| audit_refactored | false | false |

To check that writing to a pipeline schema is blocked, run the [`check_write_blocked`](../dbt/macros/check_write_blocked.sql) macro. It should fail with `permission denied for schema conformed_refactored`:

```sh
dbt run-operation check_write_blocked
```

### Database side (admin only)

Run these from the Redshift query editor as `admin`, connected to `dap_txma_reporting_db_refactored`.

```sql
-- the dbt user and group exist
select g.groname, u.usename
from pg_group g
join pg_user u on u.usesysid = any(g.grolist)
where g.groname = 'dap_dbt_developers';

-- the dbt user's session settings (statement_timeout)
select usename, useconfig from pg_user where usename = 'IAMR:production-preview-dap-dbt-developer-role';

-- schemas created by dbt (candidates for clean-up)
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

To list the SSM tunnels currently open to the bastion:

```sh
aws ssm describe-sessions --state Active --filters key=Target,value="$BASTION_ID" \
  --profile dap-production-preview --region eu-west-2 \
  --query 'Sessions[].[SessionId,StartDate]' --output text
```

Sessions can stay active after you close the local terminal. End them with `aws ssm terminate-session --session-id <id>`.

Run [`redshift_dbt_access_setup.sql`](../redshift-scripts/setup_process_refactored/redshift_dbt_access_setup.sql) again if the Redshift namespace is ever recreated, for example after following [the stack recovery runbook](runbooks/stack-recovery.md). The script ends with a commented-out block that removes all of the access.

## Troubleshooting

| Symptom | Likely cause / fix |
|---|---|
| `start-session` prints `Starting session ...` but never `Port ... opened` | Check that the session document is the corrected version. Its content should contain `"type" : "LocalPortForwarding"`: `aws ssm get-document --name production-preview-dap-redshift-port-forward --query Content --output text --profile dap-production-preview --region eu-west-2`. Also check that the bastion shows as `Online` in SSM. |
| `SessionManagerPlugin is not found` | The Session Manager plugin isn't installed or isn't on your `PATH`. See setup step 1. |
| `AccessDenied` when assuming `dap-preview-dbt` | Your SSO session isn't one of the TEAM-approved roles, or it has expired. Request access in TEAM again and run `aws sso login`. |
| `AccessDeniedException ... GetCredentials` | You're not using the dbt role. Check that `AWS_PROFILE=dap-preview-dbt` is set in the shell where you run dbt. |
| `Connection refused` on `localhost:5439` | The tunnel isn't running, or it uses a different local port from `DBT_TUNNEL_PORT`. |
| `Env var required but not provided: 'DBT_DEVELOPER_NAME'` | Set `DBT_DEVELOPER_NAME`. See setup step 4. |
| `Could not find profile named 'dap'`, or `profiles.yml file [ERROR not found]` / `dbt_project.yml file [ERROR not found]` | dbt isn't being run from the `dbt/` directory, so it can't find `dbt/profiles.yml`. Run `cd dbt` first, or use `dbt/connect.sh`. |
| `certificate verify failed: Hostname mismatch` | `sslmode` is set to `verify-full`. Use `require`. |
| `permission denied for schema ...` | This is expected for the pipeline schemas and for anything not in the access table above. Write your models to your own `dbt_<name>` schema. |
| `mashumaro.exceptions.UnserializableField` | dbt is running on Python 3.14 or later. Use Python 3.13. |
| Query cancelled after 30 minutes | `statement_timeout` is set to 30 minutes for the dbt user. |
| `ExpiredToken` partway through work | The role session is over one hour old. Run `aws sso login` again if needed, then rerun dbt. |
| `connect.sh` stops with `uses the 'ViewOnlyAccessPermission' permission set` | Your SSO profile is still using the standing role. Get an approved role in TEAM, set the profile's `sso_role_name` to it, and run `aws sso login` again. |
| `connect.sh` stops with `Port 5439 is already in use` | Another tunnel, or a local database, is using the port. Close it, or run `dbt/connect.sh --port 15439`. |
| `connect.sh` warns `Couldn't end session ...` | The session closes itself once it has been idle for the Session Manager timeout. If you see this often, check that the `ManageOwnSessions` statement in `dbt-access.yml` has been deployed. |

## Things to be aware of

- Every developer connects as the same database user, so the database lets you see, and drop, each other's `dbt_*` schemas. The drop in `connect.sh` only touches your own schemas: `dbt_<your_name>` and `dbt_<your_name>_*`.
- dbt runs on the same workgroup as the DAP pipeline's stored procedures. Large models compete with the pipeline for capacity and cost money, so avoid running full refreshes repeatedly.
- If you use two `connect.sh` sessions with the same `DBT_DEVELOPER_NAME` at the same time, closing one drops the schemas the other is using. Run the second session with `--keep-schema`.

## Dropping your schemas

`connect.sh` drops your schemas automatically when a session starts and ends, unless you use `--keep-schema`. If the drop at the end fails, for example because the tunnel has already gone, the next session drops them when it starts.

If you used `--keep-schema`, or followed the manual steps, drop them yourself with the [`drop_developer_schemas`](../dbt/macros/drop_developer_schemas.sql) macro. Run it from `dbt/` with the tunnel open:

```sh
dbt run-operation drop_developer_schemas --args '{dry_run: true}'   # lists what would be dropped
dbt run-operation drop_developer_schemas
```
