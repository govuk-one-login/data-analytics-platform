# Build info

The flyway tar file and redshift jar file in this directory are managed by [Git LFS](https://git-lfs.com) as they are large files.

At build time (the `build` script in `package.json`), the [build-flyway-layer.sh](../../../scripts/build-flyway-layer.sh) script is executed which does the following:
* Creates a `flyway` subdirectory of the `layer-dist` directory
* Moves the run-flyway script to a `bin/` subdirectory (`layer-dist/flyway/bin`)
* Extracts the tar file into a `flyway/` subdirectory (`layer-dist/flyway/flyway`)
* Deletes various files within the extracted folder to make the deployment package within AWS limits (see [here](https://docs.aws.amazon.com/lambda/latest/dg/gettingstarted-limits.html))
* Copies in the redshift driver and the SQL migrations the correct places in the extracted folder

# Deployment info

The `layer-dist/flyway/` directory will be zipped up by AWS SAM into a layer. AWS puts this into `/opt` in the lambda but adds anything under `/bin` to `$PATH`.
Because of this we can execute the run script simply by running `run-flyway` like any other command line program.

For more information see [here](https://docs.aws.amazon.com/lambda/latest/dg/packaging-layers.html#packaging-layers-paths).
