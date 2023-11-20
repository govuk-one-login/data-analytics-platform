import { faker } from '@faker-js/faker';
import { publishAndValidate, setEventData, setEventDataWithoutUser } from '../helpers/event-data-helper';
import fs from 'fs';
import { prepareDocumentKey, toCamelCase } from '../helpers/common-helpers';

describe('IPV_CRI_F2F GROUP Test - valid TXMA Event F2F_CRI_VC_ISSUED to SQS and expect event id stored in S3', () => {
  test.concurrent.each`
    eventName                    | event_id             | file_name              | document_type | issuing_country 
    ${'F2F_CRI_VC_ISSUED'}     | ${faker.string.uuid()}   | ${'txma-event-with_empty_restricted.json'}            | ${'DRIVING_LICENCE'} | ${[
      null,
    ]}
    ${'F2F_CRI_VC_ISSUED'}     | ${faker.string.uuid()}  | ${'txma-event-with_empty_restricted.json'}            | ${'DRIVING_LICENCE'} | ${[
      'GBR',
    ]}
    ${'F2F_CRI_VC_ISSUED'}     | ${faker.string.uuid()}  | ${'txma-event-with_empty_restricted.json'}            | ${'RESIDENCE_PERMIT'} | ${[
      null,
    ]}
    ${'F2F_CRI_VC_ISSUED'}     | ${faker.string.uuid()}  | ${'txma-event-with_empty_restricted.json'}            | ${'DRIVING_LICENCE'} | ${[
      'GBR',
    ]}
    ${'F2F_CRI_VC_ISSUED'}     | ${faker.string.uuid()}  | ${'txma-event-with_empty_restricted.json'}            | ${'DRIVING_LICENCE'} | ${[
      'GBR',
    ]}
    ${'F2F_CRI_VC_ISSUED'}     | ${faker.string.uuid()}  | ${'txma_event_with_empty_checkdetails.json'}            | ${'PASSPORT'} | ${[
      null,
    ]}
    `(
    'Should validate $eventName event with $document_type content stored on S3',
    async ({ ...data }) => {
      // given
      const filePath = 'tests/fixtures/' + data.file_name;
      const event = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      setEventData(event, data);
      const restricts = data.issuing_country.map(issuingCountry => {
        const restrict = {};
        restrict['documentType'] = data.document_type;
        restrict['issuingCountry'] = issuingCountry;
        return restrict;
      });
      let restrictKey = prepareDocumentKey(data.document_type);
      event.restricted[restrictKey] = restricts;
      // console.log('Event Data' + JSON.stringify(event));
      // when
      await publishAndValidate(event);
    },
    240000,
  );
});

describe('IPV_CRI_F2F GROUP Test - valid TXMA Event F2F_YOTI_START to SQS and expect event id stored in S3', () => {
  test.concurrent.each`
    eventName                    | event_id             | file_name              | document_type | issuing_country 
    ${'F2F_YOTI_START'}     | ${faker.string.uuid()}   | ${'txma-event-without_extention_empty_restricted.json'}            | ${'DRIVING_LICENCE'} | ${[
      null,
    ]}
    ${'F2F_YOTI_START'}     | ${faker.string.uuid()}  | ${'txma-event-without_extention_empty_restricted.json'}            | ${'PASSPORT'} | ${[
      'IND',
    ]}
    ${'F2F_YOTI_START'}     | ${faker.string.uuid()}  | ${'txma-event-without_extention_empty_restricted.json'}            | ${'RESIDENCE_PERMIT'} | ${[
      null,
    ]}
    ${'F2F_YOTI_START'}     | ${faker.string.uuid()}  | ${'txma-event-without_extention_empty_restricted.json'}            | ${'DRIVING_LICENCE'} | ${[
      'GBR',
    ]}
    ${'F2F_YOTI_START'}     | ${faker.string.uuid()}  | ${'txma-event-without_extention_empty_restricted.json'}            | ${'RESIDENCE_PERMIT'} | ${[
      'GBR',
    ]}
    ${'F2F_YOTI_START'}     | ${faker.string.uuid()}  | ${'txma-event-without_extention_empty_restricted.json'}            | ${'PASSPORT'} | ${[
      null,
    ]}
    `(
    'Should validate $eventName event with $document_type content stored on S3',
    async ({ ...data }) => {
      // given
      const filePath = 'tests/fixtures/' + data.file_name;
      const event = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      setEventData(event, data);
      const restricts = data.issuing_country.map(issuingCountry => {
        const restrict = {};
        restrict['documentType'] = data.document_type;
        restrict['issuingCountry'] = issuingCountry;
        return restrict;
      });
      let restrictKey = prepareDocumentKey(data.document_type);
      event.restricted[restrictKey] = restricts;
      // console.log('Event Data' + JSON.stringify(event));
      // when
      await publishAndValidate(event);
    },
    240000,
  );
});
