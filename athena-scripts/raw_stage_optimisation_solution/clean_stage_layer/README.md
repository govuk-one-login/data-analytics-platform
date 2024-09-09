# Stage layer clean up script

This script is used remove an event from the stage layer which may need to be reprocessed

The script will delete all S3 files from the txma_stage_layer table for a specific event name and will search through S3 files in the txma_stage_layer_key_values table for event ids that correspond to those event names and delete those too

## Config file

You can specify the event name you wish to delete in the config file and the specific environment the event should be deleted from

## Setup

This is a python script so ensure you have python installed by running `python3 --version`. Run the below scripts to download the necessary libraries 

- `pip3 install pandas awswrangler boto3`

## How to run

Before running, ensure you are signed in to the environment you wish to run this script against by setting the below environment variables: 

- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `AWS_SESSION_TOKEN`

When you are signed in, run the below command to run the script

- Run `python3 clean_stage_layer.py` from this directory

This can take some time to complete, ensure the VPN does not drop during the execution of the script. 


The script will output a summary of the actions is performed in the console when it has finished
