import { AuditEvent } from '../../../../common/types/event';
import { randomUUID } from 'crypto';
import { buildExpectedRawLayerRow } from '../../helpers/builders/raw-layer-row-builder';
import { buildExpectedStageLayerRow } from '../../helpers/builders/stage-layer-row-builder';

const event_id = randomUUID();

export const constructAuthMfaMethodAddStartedTestEvent11 = (
  timestamp: number,
  timestamp_formatted: string,
  event_timestamp_ms: number,
  event_timestamp_ms_formatted: string,
): AuditEvent => ({
  event_id: event_id,
  event_name: 'AUTH_MFA_METHOD_ADD_STARTED',
  component_id: '76staij516zlid81z3di',
  timestamp: timestamp,
  timestamp_formatted: timestamp_formatted,
  event_timestamp_ms: event_timestamp_ms,
  event_timestamp_ms_formatted: event_timestamp_ms_formatted,
  restricted: {
    device_information: {
      encoded:
        'fazn0menm2xnkf70m60uduq20ea22yxo1u8m2cffcy2n8y0hj5ng10nbw12ktw07rdax6z8y90zlpwoznn8wd7zbcy80qymp2fhozhpm3b0446j3bwvj5pc6jdf3ybbk7vc7esotp4wyppa5y0m4wdq8bdamm62w4ckacflui4y6ffevf6709cozsdealcyiwqov1wdw',
    },
    domain_name: 'mzp7ru09sm7iwkzdh9ep673jrqo089ze1la5ou72ose9u7mj3fyeco0ks4cvdrka',
  },
});

// Test Event 11: Expected raw layer row data
export const constructAuthMfaMethodAddStartedTestEvent11ExpectedRawLayerRow = (
  timestamp: number,
  timestamp_formatted: string,
  event_timestamp_ms: number,
  event_timestamp_ms_formatted: string,
  datecreated: string,
) =>
  buildExpectedRawLayerRow({
    event_id: event_id,
    event_name: 'AUTH_MFA_METHOD_ADD_STARTED',
    component_id: '76staij516zlid81z3di',
    client_id: null,
    timestamp: timestamp,
    timestamp_formatted: timestamp_formatted,
    user: null,
    event_timestamp_ms: event_timestamp_ms,
    event_timestamp_ms_formatted: event_timestamp_ms_formatted,
    extensions: null,
    restricted:
      '{"device_information":{"encoded":"fazn0menm2xnkf70m60uduq20ea22yxo1u8m2cffcy2n8y0hj5ng10nbw12ktw07rdax6z8y90zlpwoznn8wd7zbcy80qymp2fhozhpm3b0446j3bwvj5pc6jdf3ybbk7vc7esotp4wyppa5y0m4wdq8bdamm62w4ckacflui4y6ffevf6709cozsdealcyiwqov1wdw"},"domain_name":"mzp7ru09sm7iwkzdh9ep673jrqo089ze1la5ou72ose9u7mj3fyeco0ks4cvdrka"}',
    txma: null,
    datecreated: datecreated,
  });

// Test Event 11: Expected stage layer row data
export const constructAuthMfaMethodAddStartedTestEvent11ExpectedStageLayerRow = (
  timestamp: number,
  timestamp_formatted: string,
  event_timestamp_ms: number,
  event_timestamp_ms_formatted: string,
  year: number,
  month: number,
  day: number,
  processed_dt: number,
  processed_time: number,
) =>
  buildExpectedStageLayerRow({
    event_id: event_id,
    client_id: null,
    component_id: '76staij516zlid81z3di',
    timestamp: timestamp,
    timestamp_formatted: timestamp_formatted,
    user_govuk_signin_journey_id: null,
    user_user_id: null,
    partition_event_name: 'AUTH_MFA_METHOD_ADD_STARTED',
    event_timestamp_ms: event_timestamp_ms,
    event_timestamp_ms_formatted: event_timestamp_ms_formatted,
    year: year,
    month: month,
    day: day,
    processed_time: processed_time,
    processed_dt: processed_dt,
    event_name: 'AUTH_MFA_METHOD_ADD_STARTED',
  });

// Test Event 11: Expected stage layer key values data
export const constructAuthMfaMethodAddStartedTestEvent11ExpectedStageLayerKeyValues = () => undefined;
