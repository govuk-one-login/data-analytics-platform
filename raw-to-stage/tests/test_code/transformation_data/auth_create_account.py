from uuid import uuid4

def auth_create_account_input_output(timestamp, timestamp_formatted, timestamp_ms, processed_dt, processed_time):
    event_id = str(uuid4())
    user_id = str(uuid4())
    govuk_signin_journey_id = str(uuid4())
    event_name = "AUTH_CREATE_ACCOUNT"
    year, month, day = "2025", "01", "01"

    raw = {
        "event_id": event_id,
        "event_name": event_name,
        "component_id": "testComponentId",
        "timestamp": timestamp,
        "timestamp_formatted": timestamp_formatted,
        "event_timestamp_ms": timestamp_ms,
        "event_timestamp_ms_formatted": timestamp_formatted,
        "user": f'{{"govuk_signin_journey_id": "{govuk_signin_journey_id}", "user_id": "{user_id}"}}',
        "txma": '{"configVersion": "1.1.33"}',
        "client_id": "someClientId",
        "extensions": None,
        "datecreated": f'year={year}/month={month}/day={day}'
    }

    stage_layer = {
        "event_id": event_id,
        "event_name": event_name,
        "client_id": "someClientId",
        "component_id": "testComponentId",
        "timestamp": timestamp,
        "timestamp_formatted": timestamp_formatted,
        "user_govuk_signin_journey_id": govuk_signin_journey_id,
        "user_user_id": user_id,
        "partition_event_name": event_name,
        "event_timestamp_ms": timestamp_ms,
        "event_timestamp_ms_formatted": timestamp_formatted,
        "year": year,
        "month": month,
        "day": day,
        "processed_dt": processed_dt,
        "processed_time": processed_time,
    }

    stage_layer_key_values = [{
        "event_id": event_id,
        "parent_column_name": "txma",
        "key": "configVersion",
        "value": "1.1.33",
        "processed_dt": processed_dt,
        "processed_time": processed_time
    }]

    return {
        "raw": raw,
        "stage_layer": stage_layer,
        "stage_layer_key_values": stage_layer_key_values
    }
