# How to use Flyway

[Documentation Link](https://documentation.red-gate.com/flyway)

## Running Flyway

Use the [✳️ Run flyway command on redshift](https://github.com/govuk-one-login/data-analytics-platform/actions/workflows/run-flyway-command.yml) workflow on GitHub Actions.

### Inputs

#### Use workflow from

The branch to run the workflow on (i.e. the branch whose Flyway migrations you want applied). This will probably be a feature branch you are working on, or main.

#### AWS environment

The AWS environment to run the workflow on.

#### Flyway command to run

Flyway command to run. For more on the different commands, refer to the documentation [here](https://documentation.red-gate.com/flyway/flyway-cli-and-api/commands).

#### Database on which to perform migrations

Name of the redshift database you wish to run migrations on. **There must be a corresponding subfolder in `redshift-scripts/flyway/migrations` or the job will fail.
See section below under the _Repository Files_ heading for more on this.**

## Repository Files

The files for Flyway are under the [redshift-scripts/flyway/](.) directory.

### `lib/`

Library files for Flyway (library itself and the Redshift JAR). These can be left alone for the most part unless you need to update one or the other.

### `migrations/`

Migration files for Flyway. For more on the concept, refer to the documentation [here](https://documentation.red-gate.com/flyway/flyway-cli-and-api/concepts/migrations).

#### Database subdirectories

Note that all migration files are under subdirectories of the `migrations/` directory. These subdirectories are the names of databases in Redshift.
This means that

* Each database has a separate set of migrations and version numbers do not conflict between them (e.g. two different databases may have a V1.2 migration) 
* The database chosen for the GitHub workflow must be one of these and will determine which migrations are run and on which database

##### An example

Consider the following directory layout
```
redshift-scripts/
  flyway/
    database_one/
      V1__create_user_table.sql
      V2__add_user_email_column.sql
    database_two/
      V1__set_up_schemas.sql
```

* Running the workflow with a database input of `database_one` will run `V1__create_user_table.sql` and `V2__add_user_email_column.sql` on the `database_one` database in redshift
  * The migrations will run with reference to `"database_one"."flyway_schema_history";`
  * No other migrations will be run (if you also wanted to migrate `database_two` you would need to run the workflow a second time with that as the database input)
  * All other databases will be unaffected

#### Migration types

Flyway allows you to use versioned or repeatable migrations. For descriptions of both types, refer to the documentation [here](https://documentation.red-gate.com/flyway/flyway-cli-and-api/concepts/migrations).
