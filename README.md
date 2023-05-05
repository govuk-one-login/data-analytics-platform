# DI Data Analytics Platform

Data and Analytics platform which will enable the implementation of the [OneLogin reporting strategy](https://govukverify.atlassian.net/l/cp/ZBmDjKz0).

### Prerequisites

##### Install development tools

The project uses the current (as of 03/05/2023) LTS of Node, version 18.
The GDS recommendation is to use `nvm` to manage Node versions - installation instructions can be found [here](https://github.com/nvm-sh/nvm#installing-and-updating).

* [AWS SAM CLI](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html) - for running SAM commands
* [AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html) - (optional) for interacting with AWS on the command line
* [Node](https://nodejs.org/en) - we use LTS version 18. GDS recommends using [nvm](https://github.com/nvm-sh/nvm#installing-and-updating) to install
* [Docker](https://docs.docker.com/desktop/install/mac-install) - for running `sam local`
* [Checkov](https://www.checkov.io) - IaC validation tool. Install on GDS Macs in the terminal by running `pip3 install checkov`

##### Set up GPG commit signing

Commits will be rejected if not signed and verified by GitHub. SSH keys do not support verification so GPG must be used.
Follow the instructions [here](https://docs.github.com/en/authentication/managing-commit-signature-verification/about-commit-signature-verification#gpg-commit-signature-verification) to generate a key and set it up with GitHub.
You may need to install `gpg` first - open the Mac terminal and run `brew install gpg`.
