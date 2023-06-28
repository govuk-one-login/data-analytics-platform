# TODOs

* Implement precommit hooks. BTM and TxMA seem to use [Husky](https://typicode.github.io/husky)
* Simplify the [Test and validate iac and lambdas](../.github/workflows/test-and-validate.yml) workflow
    * Can we use an `npm` script for the checkov step, as they are used for other steps?
    * Can we extract the duplicated config of both jobs setting up node?
    * Run prettier once covering all js/ts/json/yaml - instead of separately for IaC and Lambdas?
* Can we speed up the IaC checks?
