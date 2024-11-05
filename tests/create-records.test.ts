import 'dotenv/config';
import { expect, test } from 'vitest';
import { createRecord, createRecords } from '../src/index';

const apiKey = process.env.API_KEY as string;
const baseId = process.env.TEST_BASE_ID as string;
const tableId = process.env.TEST_TABLE_NAME_ALL_FIELDS as string;

type TestFields = {
  Name?: string;
  Notes?: string;
  Status?: string;
  recordId?: string;
};

test('createRecord', async () => {
  const response = await createRecord<TestFields>({
    apiKey,
    baseId,
    tableId,
    fields: {
      Name: `Name ${Math.random()}`,
      Notes: `Notes ${Math.random()}`,
    },
  });

  expect(response.id).toBeDefined();
  expect(response.fields.Name).toBeDefined();
});

test('createRecords', async () => {
  const records = Array.from({ length: 20 }, (_, index) => ({
    fields: {
      Name: `Name ${index + 1} ${Math.random()}`,
      Notes: `Notes ${index + 1} ${Math.random()}`,
    },
  }));

  const response = await createRecords<TestFields>({
    apiKey,
    baseId,
    tableId,
    records,
    options: {
      requestInterval: 10,
      typecast: true,
    },
  });

  console.log(response);
  expect(response.records.length).toBe(records.length);
});
