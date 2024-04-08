import 'dotenv/config';
import { expect, test } from 'vitest';
import { getRecords, updateRecords } from '../src/index';
import { updateRecordsUpsert } from '../src/requests';

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
  const ids = [
    'recLztqW64aB9nee1',
    'recP3kAIPZjv22OOI',
    'rec60AL6Ka8xdQBCu',
    'recOSt005dz0whSE9',
    'recUygOrLG3JEAdsy',
    'recTbKc7aLrTbbTA0',
    'recGzCmrMRQ60AbaV',
    'rec8CmgnFG4hyLGVB',
    'rec9hCpuqF2gCKfUR',
    'recb5URDFfTdDVAfA',
    'recM0LJeSHQZM1vA9',
    'recxayfI7bzcBYzC9',
    'rec7CUmnJwLQqbeAn',
    'rec2TR9r6P450ptb5',
    'rec5bprRpgdjlNkfe',
    'reccZhVEsY3aexfKB',
    'recoZbSgTaALuePZz',
    'rec75JO32DbwVRzCw',
    'reclJ6eKQ0RZOTKpN',
    'recqElcQt3ZaYf2re',
    'recbJAAwxkAPRdfWR',
    'recd6IqCzTv6tnHDS',
    'rec5ffGANWfpnngfJ',
    'recMp6sX4FASMijUF',
    'rec4WBusP8xNrVfTN',
  ];

  const records = ids.map((id, index) => ({
    id,
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
  expect(response.records.length).toBe(ids.length);
});

test('updateRecords with Upsert', async () => {
  const response = await updateRecordsUpsert<TestFields>({
    apiKey,
    baseId,
    tableId,
    options: {
      fieldsToMergeOn: ['Name'],
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
        id: 'recOSt005dz0whSE9',
        fields: { Notes: `Notes 3 ${Math.random()}` },
      },
    ],
  });

  console.log(response);
  expect(response.records.length > 0).toBe(true);
});
