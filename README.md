# DI Data Analytics Platform

Data and Analytics platform which will enable the implementation of the [OneLogin reporting strategy](https://govukverify.atlassian.net/l/cp/ZBmDjKz0).

## Prerequisites

#### Install development tools

The project uses the current (as of 03/05/2023) LTS of Node, version 18.
The GDS recommendation is to use `nvm` to manage Node versions - installation instructions can be found [here](https://github.com/nvm-sh/nvm#installing-and-updating).

###### Core

* [AWS SAM CLI](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html) - for running SAM commands
* [Node](https://nodejs.org/en) - for lambda development and running `npm` commands
* [Docker](https://docs.docker.com/desktop/install/mac-install) - for running `sam local`
* [Checkov](https://www.checkov.io) - for validating IaC code. Install on GDS Macs in the terminal by running `pip3 install checkov`

###### Optional

* [AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html) - for interacting with AWS on the command line
* [GitHub CLI](https://cli.github.com) - for interacting with GitHub on the command line. Can do some things not possible via the GUI, such as running workflows that have not been merged to `main`

#### Set up commit signing

Commits will be rejected by GitHub if they are not signed using an SSH or GPG key. SSH keys do not support expiration or revocation so GPG is preferred.
Follow the instructions [here](https://docs.github.com/en/authentication/managing-commit-signature-verification/about-commit-signature-verification#gpg-commit-signature-verification) to generate a key and set it up with GitHub.
You may need to install `gpg` first - on a GDS Mac open the terminal and run `brew install gpg`.

## Repository structure

#### Lambdas

The lambdas and supporting code are written in [TypeScript](https://www.typescriptlang.org) and built with [esbuild](https://esbuild.github.io).

Individual lambda handlers (and unit tests) can be found in subdirectories of the [src/handlers](src/handlers) directory.
Common and utility code can be found in the [src/shared](src/shared) directory.

In addition, files to support running lambdas with `sam local invoke` are in the [sam-local-examples](sam-local-examples) directory.

#### IaC

IaC code is written in [AWS SAM](https://aws.amazon.com/serverless/sam) (a superset of [CloudFormation](https://aws.amazon.com/cloudformation) templates) and deployed as a SAM application.

IaC code can be found in the [iac](iac) directory. In here there is a base file, [base.yml](iac/base.yml), which contains everything except the `Resources` section.
In the [resources subdirectory](iac/resources), there are YAML files containing all the stack resources, grouped by functional area. A `package.json` script, `iac:build`,
(which uses [a bash script](scripts/build-sam-template.sh)) concatenates all these files into a single top-level `template.yaml` file that is expected by SAM and Secure Pipelines.

The [AWS SAM](https://aws.amazon.com/serverless/sam) config is at [samconfig.toml](samconfig.toml).

#### Workflows

[Workflows](https://docs.github.com/en/actions/using-workflows/about-workflows) that enable [GitHub Actions](https://docs.github.com/en/actions) can be found in the [.github/workflows](.github/workflows) directory.
Below is a list of workflows:

| Name                              | File                    | Triggers                                                                                                                                                                                                                                                                                                                                                                        | Purpose                                                                                            |
|-----------------------------------|-------------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------|
| Deploy to an AWS environment      | deploy-to-aws.yml       | <ul><li>[other workflows](https://docs.github.com/en/actions/using-workflows/events-that-trigger-workflows#workflow_call)</li></ul>                                                                                                                                                                                                                                             | Deploys to a deployable AWS environment (dev, build, test)                                         |
| Deploy to the test environment    | deploy-to-test.yml      | <ul><li>[manual](https://docs.github.com/en/actions/using-workflows/events-that-trigger-workflows#workflow_dispatch)</li></ul>                                                                                                                                                                                                                                                  | Deploys IaC and lambda code to the test AWS                                                        |
| Deploy to the dev environment     | deploy-to-dev.yml       | <ul><li>[merge to main](https://docs.github.com/en/actions/using-workflows/events-that-trigger-workflows#push)</li><li>[manual](https://docs.github.com/en/actions/using-workflows/events-that-trigger-workflows#workflow_dispatch)</li></ul>                                                                                                                                   | Deploys IaC and lambda code to the dev AWS                                                         |
| Deploy to the build environment   | deploy-to-build.yml     | <ul><li>[merge to main](https://docs.github.com/en/actions/using-workflows/events-that-trigger-workflows#push)</li></ul>                                                                                                                                                                                                                                                        | Deploys IaC and lambda code to the build AWS                                                       |
| Test and validate iac and lambdas | test-and-validate.yml   | <ul><li>[other workflows](https://docs.github.com/en/actions/using-workflows/events-that-trigger-workflows#workflow_call)</li><li>[pull requests](https://docs.github.com/en/actions/using-workflows/events-that-trigger-workflows#pull_request)</li><li>[manual](https://docs.github.com/en/actions/using-workflows/events-that-trigger-workflows#workflow_dispatch)</li></ul> | Runs linting, formatting and testing of lambda code, and linting and scanning of IaC code          |
| Upload Athena files to S3         | upload-athena-files.yml | <ul><li>[manual](https://docs.github.com/en/actions/using-workflows/events-that-trigger-workflows#workflow_dispatch)</li></ul>                                                                                                                                                                                                                                                  | Uploads athena scripts for a particular environment (under [athena-scripts](athena-scripts)) to S3 |

## Testing

#### Unit tests

Unit testing is done with [Jest](https://jestjs.io) and the lambdas should all have associated unit tests (`*.spec.ts`).

* `npm run test` - run all tests
* `npm run test consumer` - run a specific test
    * anything after `test` is used as a regex match - so in this example `consumer` causes jest to match all tests under the `txma-event-consumer/` directory (and any other directory that might have `consumer` in its name)

#### Integration tests

TODO

#### Test reports

After running unit or integration tests, a test report called `index.html` will be available in the [test-report](test-report) directory.
This behaviour is provided by [jest-stare](https://www.npmjs.com/package/jest-stare) and configured in `jest.config.js`.

## Linting, formatting and validation

#### Lambdas

Linting and formatting are handled by [ESLint](https://eslint.org) and [Prettier](https://prettier.io) (with an [EditorConfig file](https://editorconfig.org)) respectively.
[typescript-eslint](https://typescript-eslint.io) is used to allow these tools to work with TypeScript. The formatting
rules of ESLint are disabled by the [eslint-config-prettier](https://github.com/prettier/eslint-config-prettier) NPM package so as not to conflict with Prettier.

* `npm run check` - run linting and formatting checks
* `npm run lint:check` - run linting checks and print warnings
* `npm run lint:fix` - run linting checks and (attempt to) automatically fix issues
* `npm run format:check` - run formatting checks and print warnings
* `npm run format:fix` - run formatting checks and automatically fix issues

#### IaC

AWS SAM can perform [validation and linting](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/validate-cfn-lint.html) of CloudFormation files.
In addition, [checkov](https://www.checkov.io) can find misconfigurations. Prettier can also check (or fix) the formatting of the YAML of the SAM template.

* `npm run iac:lint` - run validation and linting checks and print warnings
* `npm run iac:scan` - run checkov scan and print warnings
* `npm run iac:format:check` - run formatting checks and print warnings
* `npm run iac:format:fix` - run formatting checks and automatically fix issues

## Building and running

#### Lambdas

* `npm run build` - build (transpile, bundle, etc.) lambdas into the [dist](dist) directory

Lambdas can be run locally with [sam local invoke](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/sam-cli-command-reference-sam-local-invoke.html). A few prerequisites:

* Docker is running
* Lambda you wish to run has been built into a `.js` file (`npm run build`)
* Lambda you wish to run is defined in CloudFormation (`template.yml`)
* SAM application has been built (`sam build`)
    * **Order matters here** - this command copies the lambda JS into `.aws-sam/`, so make sure `npm run build` has been run beforehand
* You have defined a JSON file (ideally [here](sam-local-examples)) containing the event you wish to be the input event of the lambda (unless you don't need an input event)
* You have added any environment variables you need the lambda to take to [env.json](sam-local-examples/env.json)

An example invocation might be
```shell
npm run build
sam build

# invoke with no input event or environment vars
sam local invoke txma-event-consumer

# invoke specifying both an input event and environment variables
sam local invoke txma-event-consumer --env-vars sam-local-examples/env.json --event sam-local-examples/txma-event-consumer/valid.json
```

###### A note on args

* The `--env-vars` arg takes the path to a JSON file with any environment vars you want the lambda to have access to (via node `process.env`). Find these (and define more) in per-function objects within the main object in `sam-local-examples/env.json`
* The `--event` arg takes the path to a JSON file with the input event you want the lambda to have. Find these (and define more) in per-function subdirectories under `sam-local-examples/`
* A different template file path can be specified with the `--template-file` flag

SAM local can also be used to [generate events](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/using-sam-cli-local-generate-event.html).
An example invocation might be `sam local generate-event sqs receive-message` or `sam local generate-event s3 put`.
You can run `sam local generate` with no args for a list of supported services.

#### IaC

AWS SAM can [build the YAML template](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/using-sam-cli-build.html).
Artifacts will be placed into `.aws-sam/`. If you wish the lambda code to be included, it must first have been built into a `.js` file (`npm run build`).
An example invocation might be
```shell
sam build
```
which will build `template.yaml` and use the lambda code in `dist/`.
A different template file path can be specified with the `--template-file` flag and a different lambda code directory by changing the `CodeUri` global property in `template.yaml`.

## Deploying

Deployment is done via [Secure Pipelines](https://govukverify.atlassian.net/wiki/spaces/DAP/pages/3535667315/Secure+Pipelines).
At a high level, we are responsible for the SAM app and running `sam build`, but Secure Pipelines calls `sam deploy` for us.

#### Config

Deployment relies on the following AWS System Manager Parameters being available in the target AWS account:

| Name              | Description                                                                 |
|-------------------|-----------------------------------------------------------------------------|
| TxMAEventQueueARN | ARN of the TxMA event queue which triggers the `txma-event-consumer` lambda |
| TxMAKMSKeyARN     | ARN of the TxMA KMS key needed for the `txma-event-consumer` lambda         |

You can see these values being referenced in the template file in the following way:

```
'{{resolve:ssm:TxMAEventQueueARN}}'
```

See the following links for how to create the parameters via:

- [AWS Console](https://docs.aws.amazon.com/systems-manager/latest/userguide/parameter-create-console.html)
- [AWS CLI](https://docs.aws.amazon.com/systems-manager/latest/userguide/param-create-cli.html)
- [CloudFormation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-ssm-parameter.html)

#### Test

Our test environment is a standalone environment and can therefore be used as a sandbox.
A dedicated GitHub Action [Deploy to the test environment](.github/workflows/deploy-to-test.yml) exists to enable this.
It can be manually invoked on a chosen branch by finding it in the [GitHub Actions tab](https://github.com/alphagov/di-data-analytics-platform/actions) and using the _Run workflow_ button.

#### Dev

Our dev environment is also a standalone environment and can therefore be used as a sandbox.
A dedicated GitHub Action [Deploy to the dev environment](.github/workflows/deploy-to-dev.yml) exists to enable this, allowing manual deploys like the one for test.

Additionally, the action will automatically run after a merge into the `main` branch after a Pull Request is approved.

#### Build

The build environment is the entry point to the Secure Pipelines world. It is sometimes referred to as the Initial Account
in Secure Pipelines, as it is the first account on the journey to Production, and has unique needs such as the ability to deploy to from GitHub.

A GitHub Action [Deploy to the build environment](.github/workflows/deploy-to-build.yml) exists to enable this.
The action cannot be invoked manually like the one for dev, only by merging into the `main` branch after a Pull Request is approved.

## Additional Documents

For a guide to how and why certain development decisions, coding practices, etc. were made, please refer to the [Development Decisions document](docs/development-decisions.md).

For a list of TODOs for the project, please see the [TODOs document](docs/todos.md).
