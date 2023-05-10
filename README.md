# DI Data Analytics Platform

Data and Analytics platform which will enable the implementation of the [OneLogin reporting strategy](https://govukverify.atlassian.net/l/cp/ZBmDjKz0).

## Prerequisites

#### Install development tools

The project uses the current (as of 03/05/2023) LTS of Node, version 18.
The GDS recommendation is to use `nvm` to manage Node versions - installation instructions can be found [here](https://github.com/nvm-sh/nvm#installing-and-updating).

* [AWS SAM CLI](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html) - for running SAM commands
* [AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html) - (optional) for interacting with AWS on the command line
* [Node](https://nodejs.org/en) - we use LTS version 18. GDS recommends using [nvm](https://github.com/nvm-sh/nvm#installing-and-updating) to install
* [Docker](https://docs.docker.com/desktop/install/mac-install) - for running `sam local`
* [Checkov](https://www.checkov.io) - IaC validation tool. Install on GDS Macs in the terminal by running `pip3 install checkov`

#### Set up GPG commit signing

Commits will be rejected if not signed and verified by GitHub. SSH keys do not support verification so GPG must be used.
Follow the instructions [here](https://docs.github.com/en/authentication/managing-commit-signature-verification/about-commit-signature-verification#gpg-commit-signature-verification) to generate a key and set it up with GitHub.
You may need to install `gpg` first - open the Mac terminal and run `brew install gpg`.

## Repository structure

#### Lambdas

The lambdas and supporting code are written in [TypeScript](https://www.typescriptlang.org) and built with [esbuild](https://esbuild.github.io/).

Individual lambda handlers (and unit tests) can be found in subdirectories of the [src/handlers](src/handlers) directory.
Common and utility code can be found in the [src/shared](src/shared) directory.

#### IaC

IaC code is written in [AWS SAM](https://aws.amazon.com/serverless/sam) (a superset of [CloudFormation](https://aws.amazon.com/cloudformation) templates) and deployed as a SAM application.

IaC code can be found in the [template.yaml](template.yaml) file. The [AWS SAM](https://aws.amazon.com/serverless/sam) config is at [samconfig.toml](samconfig.toml).

## Testing, linting and formatting

#### Lambdas

Unit testing is done with [Jest](https://jestjs.io) and the lambdas should all have associated unit tests (`*.spec.ts`).

* `npm run test` - run all tests
* `npm run test consumer` - run a specific test
    * anything after `test` is used as a regex match - so in this example `consumer` causes jest to match all tests under the `txma-event-consumer/` directory (and any other directory that might have `consumer` in its name)

Linting and formatting are handled by [ESLint](https://eslint.org) and [Prettier](https://prettier.io) respectively.
[typescript-eslint](https://typescript-eslint.io) is used to allow these tools to work with TypeScript. The formatting
rules of ESLint are disabled by the [eslint-config-prettier](https://github.com/prettier/eslint-config-prettier) NPM package so as not to conflict with Prettier.

* `npm run check` - run linting and formatting checks
* `npm run lint:check` - run linting checks and print warnings
* `npm run lint:fix` - run linting checks and (attempt to) automatically fix issues
* `npm run format:check` - run formatting checks and print warnings
* `npm run format:fix` - run formatting checks and automatically fix issues

#### IaC

AWS SAM can perform [validation and linting](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/validate-cfn-lint.html) of CloudFormation files.
In addition, [checkov](https://www.checkov.io) can find misconfigurations.

* `npm run iac:lint` - run validation and linting checks and print warnings
* `npm run iac:scan` - run checkov scan and print warnings
