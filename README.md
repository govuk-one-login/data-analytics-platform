# DI Data Analytics Platform

Data and Analytics platform which will enable the implementation of the [GOV.UK One Login reporting strategy](https://govukverify.atlassian.net/l/cp/ZBmDjKz0).

## Prerequisites

#### Install development tools

###### Core

* [AWS SAM CLI](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html) - for running SAM commands
* [Node](https://nodejs.org/en) - for lambda development and running `npm` commands
* [Docker](https://docs.docker.com/desktop/install/mac-install) - for running `sam local`
* [Checkov](https://www.checkov.io) - for validating IaC code. Install on GDS Macs in the terminal by running `pip3 install checkov`

Ensure your SAM CLI version matches the version used in GitHub workflow files (currently 1.134.0) otherwise you may get errors locally that do not appear in GitHub Actions

The project currently uses Node 22. The GDS recommendation is to use `nvm` to manage Node versions - installation instructions can be found [here](https://github.com/nvm-sh/nvm#installing-and-updating).

###### Optional

* [AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html) - for interacting with AWS on the command line
* [GitHub CLI](https://cli.github.com) - for interacting with GitHub on the command line. Can do some things not possible via the GUI, such as running workflows that have not been merged to `main`

#### Set up commit signing

Commits will be rejected by GitHub if they are not signed using an SSH or GPG key. SSH keys do not support expiration or revocation so GPG is preferred.
Follow the instructions [here](https://docs.github.com/en/authentication/managing-commit-signature-verification/about-commit-signature-verification#gpg-commit-signature-verification) to generate a key and set it up with GitHub.
You may need to install `gpg` first - on a GDS Mac open the terminal and run `brew install gpg`.

#### Set up husky hooks

[Husky](https://typicode.github.io/husky) is used to run [githooks](https://git-scm.com/docs/githooks), specifically `pre-commit` and `pre-push`.
To install the hooks run

`npm run husky:install`

`python3 -m venv venvlocal` (Creates a [python venv](https://docs.python.org/3/library/venv.html) in the local directory [venvlocal/](venvlocal) - run only if this venv doesn't exist already)

`source venvlocal/bin/activate` (Adds the venv directory to your PATH so running `python` will use the venv python and the packages it installed)

`pip install -r raw-to-stage/requirements.txt` (Installs packages from [requirements.txt](raw-to-stage/requirements.txt) - only needs to be run first time)

After this, the hooks defined under the [.husky](.husky) directory will automatically run when you commit or push.&ast;
The [lint-staged](https://github.com/okonet/lint-staged) library is used to only run certain tasks if certain files are modified.

Config can be found in the `lint-staged` block in [package.json](package.json). Note that `lint-staged` works by passing
a list of the matched staged files to the command defined, which is why the commands in `package.json` are e.g. `prettier --write`, with no file, directory or glob arguments.
(usually if you wanted to run prettier you would need such an argument, e.g.`prettier --write .` or `prettier --check src`. More information can be found [here](https://github.com/okonet/lint-staged#configuration).

&ast; Git LFS hooks also live in this directory - see section below

#### Set up Git LFS

If you intend to make changes to any of the large binary files in this repository (currently just `*.tar.gz` and `*.jar`) then you will need to install [Git LFS](https://git-lfs.com).
This is necessary as [GitHub blocks files larger than 100 MiB](https://docs.github.com/en/repositories/working-with-files/managing-large-files/about-large-files-on-github).

If you do not install Git LFS you will only get the pointer files and not the actual data. **This is not a problem unless you want to edit these files.**
See [this section of the GitHub docs](https://docs.github.com/en/repositories/working-with-files/managing-large-files) for more information

Git LFS also uses hooks, specifically `post-checkout`, `post-commit`, `post-merge` and `pre-push`.
In the case of the latter, husky also uses this hook which is why the file at [.husky/_/pre-push](.husky/_/pre-push) contains both husky and Git LFS code.
Note that the Git LFS hooks are in the husky directory because husky was installed in the repository before Git LFS and so that directory structure was already in place.
Manually editing the hooks was necessary due to the clash on `pre-push`, and [this comment](https://github.com/typicode/husky/issues/108#issuecomment-1432554983) was the general direction taken.

## Repository structure

#### Lambdas

The lambdas and supporting code are written in [TypeScript](https://www.typescriptlang.org) and built with [esbuild](https://esbuild.github.io).

Individual lambda handlers (and unit tests) can be found in subdirectories of the [src/handlers](src/handlers) directory.
Common and utility code can be found in the [src/shared](src/shared) directory.

In addition, files to support running lambdas with `sam local invoke` are in the [sam-local-examples](sam-local-examples) directory.

#### IaC

IaC code is written in [AWS SAM](https://aws.amazon.com/serverless/sam) (a superset of [CloudFormation](https://aws.amazon.com/cloudformation) templates) and deployed as SAM applications.

IaC code can be found in the [iac](iac) directory. There are currently two applications, each with its own subdirectory ([main](iac/main) and [quicksight-access](iac/quicksight-access)).
In each there is a base file, `base.yml`, which contains everything except the `Resources` section.
In the `resources/` subdirectory, there are YAML files containing all the stack resources, grouped by functional area.

The [AWS SAM](https://aws.amazon.com/serverless/sam) config is at [samconfig.toml](samconfig.toml).

#### Workflows

[Workflows](https://docs.github.com/en/actions/using-workflows/about-workflows) that enable [GitHub Actions](https://docs.github.com/en/actions) can be found in the [.github/workflows](.github/workflows) directory.
Below is a list of workflows. The ✳️ symbol at the start of a workflow name indicates that it can be run manually.

| Name                                            | File                             | Triggers                                                                                                                                                                                                                                                                                                                                                                        | Purpose                                                                                                                                                                            |
|-------------------------------------------------|----------------------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Deploy to an AWS environment                    | deploy-to-aws.yml                | <ul><li>[other workflows](https://docs.github.com/en/actions/using-workflows/events-that-trigger-workflows#workflow_call)</li></ul>                                                                                                                                                                                                                                             | Deploys to a deployable AWS environment (dev, build)                                                                                                                               |
| ✳️ Deploy to the dev environment                | deploy-to-dev.yml                | <ul><li>[merge to main](https://docs.github.com/en/actions/using-workflows/events-that-trigger-workflows#push)</li><li>[manual](https://docs.github.com/en/actions/using-workflows/events-that-trigger-workflows#workflow_dispatch)</li></ul>                                                                                                                                   | Deploys IaC and lambda code to the dev AWS                                                                                                                                         |
| Deploy to the build environment                 | deploy-to-build.yml              | <ul><li>[merge to main](https://docs.github.com/en/actions/using-workflows/events-that-trigger-workflows#push)</li></ul>                                                                                                                                                                                                                                                        | Deploys IaC and lambda code to the build AWS                                                                                                                                       |
| ✳️ Test and validate iac and lambdas            | test-and-validate.yml            | <ul><li>[other workflows](https://docs.github.com/en/actions/using-workflows/events-that-trigger-workflows#workflow_call)</li><li>[pull requests](https://docs.github.com/en/actions/using-workflows/events-that-trigger-workflows#pull_request)</li><li>[manual](https://docs.github.com/en/actions/using-workflows/events-that-trigger-workflows#workflow_dispatch)</li></ul> | Runs linting, formatting and testing of lambda code, and linting and scanning of IaC code                                                                                          |
| ✳️ Upload Athena files to S3                    | upload-athena-files.yml          | <ul><li>[manual](https://docs.github.com/en/actions/using-workflows/events-that-trigger-workflows#workflow_dispatch)</li></ul>                                                                                                                                                                                                                                                  | Uploads athena scripts for a particular environment (under [athena-scripts](athena-scripts)) to S3                                                                                 |
| Upload testing image to ECR                     | upload-testing-image.yml         | <ul><li>[other workflows](https://docs.github.com/en/actions/using-workflows/events-that-trigger-workflows#workflow_call)</li></ul>                                                                                                                                                                                                                                             | Builds a testing dockerfile in `tests/scripts/` and uploads the image to ECR                                                                                                       |
| ✳️ Upload testing images to ECR                 | upload-testing-images.yml        | <ul><li>[merge to main](https://docs.github.com/en/actions/using-workflows/events-that-trigger-workflows#push)</li><li>[manual](https://docs.github.com/en/actions/using-workflows/events-that-trigger-workflows#workflow_dispatch)</li></ul>                                                                                                                                   | Builds one or more testing dockerfiles in `tests/scripts/` and uploads the images to ECR. Which dockerfiles to build can be specified via inputs                                   |
| SonarCloud Code Analysis                        | code-quality-sonarcloud.yml      | <ul><li>[pull requests (on open, reopen and update)](https://docs.github.com/en/actions/using-workflows/events-that-trigger-workflows#pull_request)</li></ul>                                                                                                                                                                                                                   | Runs a SonarCloud analysis on the repository                                                                                                                                       |
| ✳️ Run flyway command on redshift               | run-flyway-command.yml           | <ul><li>[manual](https://docs.github.com/en/actions/using-workflows/events-that-trigger-workflows#workflow_dispatch)</li></ul>                                                                                                                                                                                                                                                  | Runs a specified flyway command on the redshift database in a specified environment. For more on how to use this workflow see the README [here](redshift-scripts/flyway/README.md) |
| ✳️ Deploy to the production preview environment | deploy-to-production-preview.yml | <ul><li>[manual](https://docs.github.com/en/actions/using-workflows/events-that-trigger-workflows#workflow_dispatch)</li></ul>                                                                                                                                                                                                                                                  | Deploys to the production-preview environment                                                                                                                                      |
| SAM deploy                                      | sam-deploy.yml                   | <ul><li>[other workflows](https://docs.github.com/en/actions/using-workflows/events-that-trigger-workflows#workflow_call)</li></ul>                                                                                                                                                                                                                                             | Performs a SAM deploy to an environment without secure pipelines (used for production-preview)                                                                                     |
| ✳️ Upload Flyway files to S3                    | upload-flyway-files.yml          | <ul><li>[manual](https://docs.github.com/en/actions/using-workflows/events-that-trigger-workflows#workflow_dispatch)</li><li>[other workflows](https://docs.github.com/en/actions/using-workflows/events-that-trigger-workflows#workflow_call)</li></ul>                                                                                                                        | Uploads flyway files for a particular environment (under [redshift-scripts/flyway](redshift-scripts/flyway)) to S3                                                                 |
| ✳️ Export analysis from Quicksight              | quicksight-export.yml            | <ul><li>[manual](https://docs.github.com/en/actions/using-workflows/events-that-trigger-workflows#workflow_dispatch)</li></ul>                                                                                                                                                                                                                                                  | Exports a Quicksight analysis to S3 using the [asset bundle APIs](https://docs.aws.amazon.com/quicksight/latest/developerguide/asset-bundle-ops.html)                              |
| ✳️ Import analysis to Quicksight                | quicksight-import.yml            | <ul><li>[manual](https://docs.github.com/en/actions/using-workflows/events-that-trigger-workflows#workflow_dispatch)</li></ul>                                                                                                                                                                                                                                                  | Imports a Quicksight analysis from S3 using the [asset bundle APIs](https://docs.aws.amazon.com/quicksight/latest/developerguide/asset-bundle-ops.html)                            |

## Testing

#### Unit tests

Unit testing is done with [Jest](https://jestjs.io) and the lambdas should all have associated unit tests (`*.spec.ts`).

* `npm run test` - run all tests under `src/`
* `jest consumer` - run a specific test or tests
    * anything after `jest` is used as a regex match - so in this example `consumer` causes jest to match all tests under the `src/handlers/txma-event-consumer/` directory (and any other directory that might have `consumer` in its name)

You can also view code coverage reports by running this command:

```sh
npm run test:cov
```

#### Integration tests

Integration tests verify the data pipeline from SQS ingestion through to the conform layer. These are enabled to run in _dev_ or _build_ environment. They use [Jest](https://jestjs.io) and are organized into two test projects that run concurrently. The main test suite uses a shared global setup file ([setup-main-test-suite.ts](tests/integration-tests/setup-main-test-suite.ts)) that processes all test events through the pipeline before tests run, while the raw-to-stage unhappy path tests execute the Step Function individually within each test to verify error handling.

The main test suite global setup:
1. Sends test events to the TxMA SQS queue
2. Waits for events to appear in the raw layer
3. Executes the raw-to-stage ETL Step Function
4. Waits for transformed data in the stage layer
5. Waits for transformed data in the conform layer

The raw-to-stage unhappy path tests setup ([setup-raw-to-stage-unhappy-path.ts](tests/integration-tests/setup-raw-to-stage-unhappy-path.ts)) only loads environment variables, as each test writes malformed data directly to the raw S3 layer and executes the Step Function individually (expecting it to fail).

Prerequisites to running integration tests:
* Set up ~/.aws/config file with the correct AWS credentials
* Environment variables `STACK_NAME` and `AWS_REGION` set (or defaults to values in `tests/shared-test-code/constants.ts`)
* Login to AWS:
  ```sh
  export AWS_PROFILE=data-dap-{environment}
  aws sso login
  ```

To run integration tests:
```sh
npm run test:integration
```

Running `npm run test:integration` executes all integration tests concurrently in two projects:

1. **Main test suite** (uses shared global setup for efficiency):
    
   **Happy path tests**
   * `test-suites/happy-path/txma-consumer-to-raw.spec.ts` - Verifies valid TxMA events are consumed from SQS and written to raw S3 layer
   * `test-suites/happy-path/raw-to-stage.spec.ts` - Validates raw-to-stage ETL transforms raw JSON to stage layer format
   * `test-suites/happy-path/stage-conform.spec.ts` - Tests stage-to-conform ETL transformation to final reporting structure

   **Edge case tests**
   * `test-suites/raw-to-stage-edge-cases/empty-client-id.spec.ts` - Tests handling of events with empty client_id fields
   * `test-suites/raw-to-stage-edge-cases/null-extensions-excluded.spec.ts` - Verifies null extension fields are properly excluded
   
   **TxMA unhappy path test**
   * `test-suites/txma-consumer-unhappy-path/txma-consumer-unhappy-path.spec.ts` - Tests error handling in txma-consumer lambda for invalid events (missing fields, malformed timestamps)

   **Event replay test**
   * `test-suites/event-replay/event-replay.spec.ts` - Verifies replayed events update existing records rather than creating duplicates. The test waits 75 seconds between sending the initial and replay events to ensure they are processed in different batches, simulating production behavior where replayed events arrive separately

2. **Raw-to-stage-unhappy-path project** (executes Step Function individually per test):
   * `test-suites/raw-to-stage-unhappy-path/invalid-json.spec.ts` - Verifies the raw-to-stage ETL Step Function fails for events with malformed JSON

Test events are defined in `tests/integration-tests/test-events/`.

You can run specific test categories:
```sh
npm run test:integration:main                     # Run main test suite (happy path, edge cases, txma unhappy path, event replay)
npm run test:integration:raw-to-stage-unhappy   # Run only raw-to-stage unhappy path tests
npm run test:integration -- event-replay        # Run only event replay tests
```

These tests are split into two projects based on their execution patterns. The main test suite executes the ETL Step Function once in the global setup file, processing all events before any tests run. The raw-to-stage unhappy path tests execute the Step Function individually within each test (expecting failures for invalid data), making them take longer to run.

Running `npm run test:integration` will run all tests concurrently in two projects. The Step Function executions are isolated between the different test suites. The full test suite typically takes approximately 14 minutes to complete. Tests automatically clean up all test data from S3 and Athena after completion.

#### Test reports

After running unit tests, a test report called `index.html` will be available in the [test-report](test-report) directory.
This behaviour is provided by [jest-stare](https://www.npmjs.com/package/jest-stare) and configured in `jest.config.js`.

Integration tests generate JUnit XML reports using [jest-junit](https://www.npmjs.com/package/jest-junit), which are used by CI/CD pipelines (Secure Pipelines) to parse and display test results.

## Linting, formatting and validation

#### Lambdas

Linting and formatting are handled by [ESLint](https://eslint.org) and [Prettier](https://prettier.io) (with an [EditorConfig file](https://editorconfig.org)) respectively.
[typescript-eslint](https://typescript-eslint.io) is used to allow these tools to work with TypeScript.

* `npm run lint:check` - run linting and formatting checks and print warnings
* `npm run lint:fix` - run linting and formatting checks and (attempt to) automatically fix issues

#### IaC

AWS SAM can perform [validation and linting](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/validate-cfn-lint.html) of CloudFormation files.
In addition, [checkov](https://www.checkov.io) can find misconfigurations. Prettier can also check (or fix) the formatting of the YAML of the SAM template.
Prettier is used to ensure consistent formatting of the YAML.

* `npm run iac:lint` - run validation and linting checks and print warnings
* `npm run iac:scan` - run checkov scan and print warnings
* `npm run iac:format:check` - run formatting checks and print warnings
* `npm run iac:format:fix` - run formatting checks and automatically fix issues

#### Scripts

Prettier is used to ensure consistent formatting of the script files in the [scripts/](scripts) directory.
The ability to format shell scripts comes from the [prettier-plugin-sh](https://github.com/un-ts/prettier/tree/master/packages/sh) library.

* `npm run scripts:format:check` - run formatting checks and print warnings
* `npm run scripts:format:fix` - run formatting checks and automatically fix issues

## Building and running

#### Lambdas

* `npm run build` - build (transpile, bundle, etc.) lambdas into the [dist](dist) directory

Lambdas can be run locally with [sam local invoke](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/sam-cli-command-reference-sam-local-invoke.html). A few prerequisites:

* Docker is running
* Lambda you wish to run has been built into a `.js` file (`npm run build`)
* Lambda you wish to run is defined in CloudFormation and has been built into the top-level `template.yml` file (`npm run iac:build`)
    * You can use the CloudFormation resource name (e.g. `AthenaGetConfigLambda` or `EventConsumerLambda`) to refer to the lambda in the invoke command
* SAM application has been built (`sam build`)
    * **Order matters here** - this command copies the lambda JS into `.aws-sam/`, so make sure `npm run build` has been run beforehand
* You have defined a JSON file (ideally [here](sam-local-examples)) containing the event you wish to be the input event of the lambda (unless you don't need an input event)
* You have added any environment variables you need the lambda to take to [env.json](sam-local-examples/env.json)

An example invocation might be
```shell
npm run build
npm run iac:build
sam build

# invoke with no input event or environment vars
sam local invoke EventConsumerLambda

# invoke specifying both an input event and environment variables
sam local invoke EventConsumerLambda --env-vars sam-local-examples/env.json --event sam-local-examples/txma-event-consumer/valid.json
```

###### A note on args

* The `--env-vars` arg takes the path to a JSON file with any environment vars you want the lambda to have access to (via node `process.env`). Find these (and define more) in per-function objects within the main object in `sam-local-examples/env.json`
* The `--event` arg takes the path to a JSON file with the input event you want the lambda to have. Find these (and define more) in per-function subdirectories under `sam-local-examples/`
* A different template file path can be specified with the `--template-file` flag

SAM local can also be used to [generate events](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/using-sam-cli-local-generate-event.html).
An example invocation might be `sam local generate-event sqs receive-message` or `sam local generate-event s3 put`.
You can run `sam local generate` with no args for a list of supported services.

#### IaC

A `package.json` script, `iac:build`, concatenates all the files for a particular application into a single top-level `template.yaml` file that is expected by SAM and Secure Pipelines.
The script requires an argument for which application you wish to build, e.g. `npm run iac:build -- main`. (See **Repository Structure** -> **IaC** above for more detail on the two applications).

To build all applications at once (useful for linting and scanning), an additional npm script, `iac:buildall`, exists. This builds a template for each application,
`template-main.yml` and `template-quicksight-access.yml`, and puts them into the (git ignored) [iac-dist](iac-dist) directory.

## Deploying and environments

Deployment is done via [Secure Pipelines](https://govukverify.atlassian.net/wiki/spaces/DAP/pages/3535667315/Secure+Pipelines)&ast;.
The deployments are done via the [Secure Pipelines SAM deployment stack](https://govukverify.atlassian.net/wiki/spaces/PLAT/pages/3059908609/How+to+deploy+a+SAM+application+with+secure+pipelines), and
tests are run after the SAM deployment, which is done via [Secure Pipelines testing containers](https://govukverify.atlassian.net/wiki/spaces/PLAT/pages/3054010402/How+to+run+tests+against+your+deployed+application+in+a+SAM+deployment+pipeline).

The deployment of the platform is currently split two applications, `main` and `quicksight-access` (each having its own subdirectory in [iac](iac)).
This was to overcome an issue where we had hit a hard character limit for the programmatic permissions boundary (used by lambdas) caused by us having
so many `AllowedService`s in the SAM deployment stack. The solution was to make a second SAM deployment stack to have some of the `AllowedService`s
and split off some of the IaC to become its own application deployed by that stack (the Cognito and Quicksight functionality as it was the source of the most recent permissions we had requested that had put our permissions boundary over the limit).

From a Secure Pipelines point-of-view, environments can be split into two types: 'higher' and 'lower' environments.
The lower environments are _dev_ and _build_&ast;&ast;. The higher environments are _staging_, _integration_ and _production_.
More information can be found using the Secure Pipelines link above, but the key differences are that the lower environments are the only ones
that can be deployed to directly from GitHub. Deployment to the higher environments relies on 'promotion' from a lower environment, specifically
the _build_ environment. In addition, the higher environment lambdas are triggered by real TxMA event queues, whereas lower environments use a
placeholder one that we create and must put our own test events onto.

&ast; With the exception of the production preview environment - see section below

&ast;&ast; Strictly speaking, `dev` does not form part of the Secure Pipelines build system which takes an application
that is deployed to `build` all the way to `production` via the other higher environments. Our `dev` environment is a
disconnected sandbox; however it still uses Secure Pipelines to deploy directly from GitHub

#### Lower Environments

###### Dev

Our _dev_ environment is a standalone environment and can therefore be used as a sandbox.
A dedicated GitHub Action [Deploy to the dev environment](.github/workflows/deploy-to-dev.yml) exists to enable this, allowing manual deployments.

It can be manually invoked on a chosen branch by finding it in the [GitHub Actions tab](https://github.com/govuk-one-login/data-analytics-platform/actions) and using the _Run workflow_ button.
Additionally, the action will automatically run after a merge into the `main` branch after a Pull Request is approved.

###### Build

The _build_ environment is the entry point to the Secure Pipelines world. It is sometimes referred to as the 'Initial Account'
in Secure Pipelines, as it is the first account on the journey to Production, and has unique needs (compared with the higher environments) such as the ability to deploy to from GitHub.

A GitHub Action [Deploy to the build environment](.github/workflows/deploy-to-build.yml) exists to enable this.
The action cannot be invoked manually like the one for dev, only by merging into the `main` branch after a Pull Request is approved.

#### Higher Environments

###### Higher environment config

Because they use real TxMA event queues (from external AWS accounts and not in our IaC code),
deployment to higher environments&ast; relies on the following AWS System Manager Parameters being available in the target account:

&ast; These parameters are also required in the _production preview_ account as it also has a real TxMA queue.

| Name              | Description                                                                 |
|-------------------|-----------------------------------------------------------------------------|
| TxMAEventQueueARN | ARN of the TxMA event queue which triggers the `txma-event-consumer` lambda |
| TxMAKMSKeyARN     | ARN of the TxMA KMS key needed for the `txma-event-consumer` lambda         |

You can see these values being referenced in the template files in the following way:

```
'{{resolve:ssm:TxMAEventQueueARN}}'
```

Parameter values can be found [on this page](https://govukverify.atlassian.net/wiki/spaces/DAP/pages/3591471337/DAP+-+TxMA+Events+Subscription#TxMA-SQS-Queue-Details).

###### Staging

The `staging` environment is the first higher environment and so cannot be directly deployed to.
When a deployment pipeline is successful in the `build` environment, the artifact will be put in a promotion bucket
in the `build` account, which is polled by `staging`. When `staging` picks up a new build it is deployed to that environment.

###### Integration and Production

The `integration` and `production` environments are the second (and final) level of higher environment.
They behave like the `staging` environment in the sense that they cannot be deployed to but instead poll for promoted artifacts from a lower environment.
The difference between them and `staging` is that the promotion bucket `integration` and `production` poll is the one in `staging`.

#### Production Preview

The _production preview_ environment is a standalone environment that exists outside of Secure Pipelines (it is deployed with a manual `sam deploy`).
It has a GitHub Action [Deploy to the production preview environment](.github/workflows/deploy-to-production-preview.yml) but no corresponding tear down one.

To perform the deployments we use a special role in the _production preview_ environment called `dap-production-preview-deploy-role`.
It is not in the IaC because it causes one of the following issues:
* Without a `DeletionPolicy`, it gets deleted while the stack is being deleted and so the deletion fails part way through as there are then no longer the permissions to do the deletion
* With an appropriate `DeletionPolicy` this doesn't happen, but instead the next stack creation fails because the resource already exists

_Production preview_ has a real TxMA queue in addition to its placeholder queue and so requires the SSM parameters mentioned above in the _Higher environment config_ section.

## Additional Documents

For a guide to how and why certain development decisions, coding practices, etc. were made, please refer to the [Development Decisions document](docs/development-decisions.md).

For a list of TODOs for the project, please see the [TODOs document](docs/todos.md).


## Raw-to-Stage ETL Job :
The raw-to-stage ETL jobs runs as part of DAP step function to load transformed and new raw data in to the stage layer

The packaged ETL job is stored in S3 in s3://{raw}-dap-elt-metadata/txma/raw_to_stage

To install dependencies and build the package, navigate to raw-to-stage/ From the root folder run,

`pip3 install --upgrade build`
`python3 -m build`

to run the unit tests, run

`python3 -m pytest`

to upload these files to S3 use the [`Upload Athena files to S3`](https://github.com/govuk-one-login/data-analytics-platform/actions/workflows/upload-athena-files.yml) Github Action by specifying the below parameters:
    - Branch
    - Environment 

## Cognito, API Gateway, and QuickSight Authentication Flow

The authentication flow begins when a user attempts to access QuickSight dashboards. 
Amazon Cognito serves as the identity provider, managing user authentication and authorization through OAuth 2.0 flows. 
The Cognito User Pool is configured with MFA enabled and contains registered users who have permission to access the analytics dashboards. 
When users need to authenticate, they're redirected to the Cognito hosted UI where they enter their credentials and complete any required MFA challenges.

API Gateway acts as the entry point and callback handler for the authentication process. 
API Gateway instance is configured using a custom "dap" stage. It points to cognito-quicksight-access Lambda function with a callback URL registered in Cognito. 
When Cognito completes the authentication process, it redirects users back to the appropriate API Gateway endpoint with an authorization code. 
The API Gateway then triggers the Lambda function, passing along the authorization code and request context information including the domain name and path.

The Lambda function orchestrates the token exchange and QuickSight access process. 
It receives the authorization code from Cognito, constructs the proper redirect URI based on the API Gateway context, and exchanges the code for access tokens by calling Cognito's token endpoint. 
Using the access token, it retrieves user information from Cognito's userInfo endpoint to get the username. 
Finally, it calls QuickSight's GenerateEmbedUrlForRegisteredUser API to create a secure, time-limited embed URL that grants the authenticated user access to the QuickSight console. 
The Lambda returns a 302 redirect response that sends the user directly to their personalized QuickSight dashboard, completing the seamless authentication and authorization flow.

### To create user in Dev to test
1) Login to AWS Dev as Admin
2) Open Quicksight App
3) Goto account info and get Username, Email(your work email)
4) Add new user in Cognito with this username, email. Make sure to send email with credentials in add user step 
5) Use login URL from Cognito, use credentials which you got in your email
6) Change password, configure MFA and you should see quicksight dashboard

### Configuring SSO IDP URL on Quicksight
Go to Quicksight as Admin and Go to User Icon(top right corner) after login. Click on Manage Quicksight page, SSO settings.

Update IDP URL with Cognito login page URL

Now the Quicksight will use new API Gateway
