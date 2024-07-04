# Development Decisions

Development decisions in this repository were based primarily on existing practices within our [Data Pod](https://govukverify.atlassian.net/wiki/spaces/DID/pages/3453387679/Data+Pod+Teams)
(composed of us, TxMA and BTM). The repositories these practices were takes from are:

* [billing-transaction-monitoring](https://github.com/govuk-one-login/billing-transaction-monitoring) (BTM)
* [txma-event-processing](https://github.com/govuk-one-login/txma-event-processing) (TxMA) (private repo)

Both repositories are very similar to ours in the sense they have TypeScript lambdas deployed with an AWS SAM application,
using the [Platform & SRE Pod's](https://govukverify.atlassian.net/wiki/spaces/PLAT/overview) Secure Pipelines.

## Linting and Formatting

Linting is handled by [ESLint](https://eslint.org) (and made to work with TypeScript via the addition of [typescript-eslint](https://typescript-eslint.io)).
ESLint can do formatting too but we use [Prettier](https://prettier.io) for this, either on its own (for IaC and scripts), or via the [eslint-plugin-prettier](https://github.com/prettier/eslint-plugin-prettier) plugin
which enables eslint to check and fix formatting issues without having to run prettier itself (for JavaScript and TypeScript code).

[Configuration for ESLint](https://eslint.org/docs/latest/use/configure/configuration-files) can be found in the [.eslintrc.js](../.eslintrc.js) file at the top-level and is broadly based on the BTM one, except ours is written in the more standard JavaScript instead of their Yaml.
In addition, extra extensions (`eslint:recommended`, `plugin:@typescript-eslint/recommended`)
that are present in the TxMA one (and also [recommended by typescript-eslint](https://typescript-eslint.io/getting-started)) were applied in ours.
We also use the `plugin:prettier/recommended` extension to enable the Prettier integration mentioned above,
and the `jest` plugin from [eslint-plugin-jest](https://github.com/jest-community/eslint-plugin-jest).

As mentioned above, formatting is handled by Prettier which can be used directly or can be checked and fixed via ESLint for JavaScript and TypeScript code.

[Configuration for Prettier](https://prettier.io/docs/en/configuration.html) can be found in the minimal [.prettierrc](../.prettierrc) file at the top-level.
This is also similar to the BTM and TxMA ones, and uses their `singleQuote` rule. Again, ours (and TxMA's) is in the more usual JSON format rather than BTM's YAML.
The EditorConfig is again based on those in the BTM and TxMA repositories, with a slightly longer line length added.
Prettier uses the rules in the EditorConfig [to add to its configuration](https://prettier.io/docs/en/configuration.html#editorconfig) (although rules in .prettierrc take precedence).

## TypeScript Config

[TypeScript itself is configured](https://www.typescriptlang.org/docs/handbook/tsconfig-json.html) with the [tsconfig.json](../tsconfig.json) file at the top-level.
The BTM and TxMA `tsconfig.json` files didn't seem especially consistent, so it was decided to instead use a [TSConfig base configuration](https://www.typescriptlang.org/docs/handbook/tsconfig-json.html#tsconfig-bases)
instead (specifically [the one for Node 20](https://www.npmjs.com/package/@tsconfig/node20)) to adhere to best practices. 

## TypeScript Building

In order to deploy our TypeScript code as a lambda function, it needs to be bundled/transpiled/etc. to JavaScript first.
Although TypeScript itself can do this with its `tsc` compiler, this is uncommon. BTM use the common tool [webpack](https://webpack.js.org) to achieve this, but TxMA use [esbuild](https://esbuild.github.io) instead.
It was decided to go with `esbuild` because it is also the tool AWS uses for TypeScript lambdas in [their official docs](https://docs.aws.amazon.com/lambda/latest/dg/typescript-package.html).

TxMA have a config file for esbuild (`esbuild.config.ts`) but we currently do not. Our usage of the tool is quite simple so one may not be needed.
Usage can be seen in the [build-lambdas.sh](../scripts/build-lambdas.sh) script.

## Unit Testing

Unit testing is done with [Jest](https://jestjs.io) which is commonly used in GDS, and used in the BTM and TxMA repositories.

[Configuration for Jest](https://jestjs.io/docs/configuration) can be found in the [jest.config.ts](../jest.config.js) file at the top-level,
and is pretty trivial in that is merely sets a verbosity setting (in line with TxMA) and tells jest to use the `esbuild-jest` to convert the code to JavaScript.

## SAM Template

SAM template YAML code is split into various files under the [iac](../iac) directory. These files can be concatenated into a top-level template.yaml file by a bash script.
This is based on the approach in the BTM repository, where their template YAML is split into separate files under a `cloudformation/` directory and concatenated with a TypeScript script.

Having the SAM template in a `template.yaml` file at the top-level seems to be a GDS convention as several tools expect this.
For instance, the [devplatform-upload-action](https://github.com/govuk-one-login/devplatform-upload-action) expects this, providing optional `working-directory` and `template-file` arguments if you need to change it.

In addition, [SAM itself expects this](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/sam-cli-command-reference-sam-build.html).
Running `sam build` looks for a file at `template.[yaml|yml]`, and you need to add a `--template-file` flag to specify one elsewhere.
TxMA has their template following this convention, as does BTM (with the twist that it is split into multiple templates under a `cloudformation/` directory,
and assembled into a single `template.yaml` by a build step).

## GitHub Policies

Commit signing, branch protection and mandatory pull requests are taken from the [DI best practices](https://team-manual.account.gov.uk/github-policies/#github-policies).

## Deployment Config

Some configuration properties needed for deployment are stored in the AWS System Manager Parameter Store.
This enables them to be [dynamically referenced](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/dynamic-references.html#dynamic-references-ssm) in the template.
This approach is used by both BTM and TxMA.

## Checkov skips

An explanation of the Checkov checks we skip can be found [here](https://govukverify.atlassian.net/wiki/spaces/DAP/pages/3535503483/Checkov+Rules).

## Husky

Using [Husky](https://typicode.github.io/husky) to run the `pre-commit` and `pre-push` [githooks](https://git-scm.com/docs/githooks) is taken from both BTM and TxMA.
The use of the [lint-staged](https://github.com/okonet/lint-staged) library is taken from BTM.
