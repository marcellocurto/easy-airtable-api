import 'dotenv/config';
import { expect, test } from 'vitest';
import { getRecords, updateRecords, updateRecordsUpsert } from '../src/index';

const apiKey = process.env.API_KEY as string;
const baseId = process.env.TEST_BASE_ID as string;
const tableId = process.env.TEST_TABLE_NAME_ALL_FIELDS as string;

type TestFields = {
  Name?: string;
  Notes?: string;
  Status?: string;
  recordId?: string;
};

test('updateRecords', async () => {
  const existingRecords = await getRecords<TestFields>({
    apiKey,
    baseId,
    tableId,
    options: {
      maxRecords: 20,
    },
  });

  const records = existingRecords.map((record, index) => ({
    id: record.id,
    fields: {
      Name: `Name ${index + 1} ${Math.random()}`,
      Notes: `Notes ${index + 1} ${Math.random()}`,
    },
  }));

  const response = await updateRecords<TestFields>({
    apiKey,
    baseId,
    tableId,
    records,
  });

  console.log(response);
  expect(response.records.length).toBe(records.length);
});

test('updateRecords with Upsert', async () => {
  const response = await updateRecordsUpsert<TestFields>({
    apiKey,
    baseId,
    tableId,
    options: {
      fieldsToMergeOn: ['Name'],
      requestInterval: 10,
    },
    records: [
      { fields: { Name: 'Name 3', Notes: `Notes 3 ${Math.random()}` } },
      {
        fields: {
          Name: `Name ${Math.random()}`,
          Notes: `Notes ${Math.random()}`,
        },
      },
      {
        fields: {
          Name: `Name ${Math.random()}`,
          Notes: `Notes ${Math.random()}`,
        },
      },
      {
        fields: {
          Name: `Name ${Math.random()}`,
          Notes: `Notes ${Math.random()}`,
        },
      },
      {
        fields: {
          Name: `Name ${Math.random()}`,
          Notes: `Notes ${Math.random()}`,
        },
      },
      {
        fields: {
          Name: `Name ${Math.random()}`,
          Notes: `Notes ${Math.random()}`,
        },
      },
      {
        fields: {
          Name: `Name ${Math.random()}`,
          Notes: `Notes ${Math.random()}`,
        },
      },
      {
        fields: {
          Name: `Name ${Math.random()}`,
          Notes: `Notes ${Math.random()}`,
        },
      },
      {
        fields: {
          Name: `Name ${Math.random()}`,
          Notes: `Notes ${Math.random()}`,
        },
      },
      {
        fields: {
          Name: `Name ${Math.random()}`,
          Notes: `Notes ${Math.random()}`,
        },
      },
      {
        fields: {
          Name: `Name ${Math.random()}`,
          Notes: `Notes ${Math.random()}`,
        },
      },
      {
        fields: {
          Name: `Name ${Math.random()}`,
          Notes: `Notes ${Math.random()}`,
        },
      },
      {
        fields: {
          Name: `Name ${Math.random()}`,
          Notes: `Notes ${Math.random()}`,
        },
      },
      {
        fields: {
          Name: `Name ${Math.random()}`,
          Notes: `Notes ${Math.random()}`,
        },
      },
      {
        fields: {
          Name: `Name ${Math.random()}`,
          Notes: `Notes ${Math.random()}`,
        },
      },
      {
        fields: {
          Name: `Name ${Math.random()}`,
          Notes: `Notes ${Math.random()}`,
        },
      },
      {
        fields: {
          Name: `Name ${Math.random()}`,
          Notes: `Notes ${Math.random()}`,
        },
      },
      {
        fields: {
          Name: `Name ${Math.random()}`,
          Notes: `Notes ${Math.random()}`,
        },
      },
      {
        fields: {
          Name: `Name ${Math.random()}`,
          Notes: `Notes ${Math.random()}`,
        },
      },
      {
        id: 'recOSt005dz0whSE9',
        fields: { Notes: `Notes 3 ${Math.random()}` },
      },
    ],
  });

  console.log(response);
  expect(response.records.length > 0).toBe(true);
});
