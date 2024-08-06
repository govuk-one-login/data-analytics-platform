# Splunk migration script

This script is used to migrate events from the splunk performance index to the dap raw layer


## Config file

You can specify details for the splunk migration in the config file. The config file is set up to handle multiple event names with the below configurations

`event_name` - Event name to migrate from splunk to DAP
`splunk_index` - Splunk index to search, Set as gds_di_prod_txma-performance
`destination_s3_bucket` - s3 bucket to send events to, set as txma-events-splunk-preview. This will be different in other environments
`destination_s3_prefix` - Prefix to send events to, should start with txma/
`earliest_time` - earliest time filter on splunk you wish to process
`latest_time` - latest time filter on splunk you wish to filter
`search_mode` - set as normal
`output_mode` - set as json

## Setup

This is a python script so ensure you have python installed by running `python3 --version`. Run the below scripts to download the necessary libraries 

- `pip3 install splunk-sdk boto3`


## How to run

Before running, ensure you are signed in to the environment you wish to run this script against by setting the below environment variables: 

- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `AWS_SESSION_TOKEN`

You will need to specify the input name for the config file in the script by updating the `config_file` variable. You can also specify the `reconciliation_file` variable which doesn't need to exist yet, the script will create it

Then you will need to enter the `username` and `password` for the splunk performance index. This needs to be updated to be pulled down from AWS secrets manager.


run the below command to run the script

- Run `python3 splunk-data-export-gz.py` from this directory

This can take some time to complete, ensure the VPN does not drop during the execution of the script. 

The script will output a reconcilation file as a summary when it has finished

## Post actions

Once the script has been run, you will need to copy these files to the correct folder in the dap raw layer. This will allow you to run a glaw crawler which will then up update the glue catalog. Steps for this can be found at the bottom of this confluence page https://govukverify.atlassian.net/wiki/spaces/DAP/pages/3765207337/Refactor+of+DAP+Raw+and+Stage+layers


To copy the files, replace the place holders and run the following AWS command in a terminal 

`aws s3 sync s3://<splunk events bucket>/txma/<splunk events prefix>/<name of event migrated>/ s3://<environment>-dap-raw-layer/splunk/<name of event migrated>/year=<current year>/month=<current month>/day=<current day>/
`
