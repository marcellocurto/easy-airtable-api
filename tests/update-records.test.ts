import { describe, expect, test } from 'vitest';
import {
  getRecords,
  updateRecords,
  updateRecordsUpsert,
} from '../src/index.js';
import { hasIntegrationEnv, integrationEnv } from './integration-helpers.js';

type TestFields = {
  Name?: string;
  Notes?: string;
  Status?: string;
  recordId?: string;
};

describe.skipIf(!hasIntegrationEnv)('update records integration', () => {
  test('updateRecords', async () => {
    const existingRecords = await getRecords<TestFields>({
      apiKey: integrationEnv.apiKey!,
      baseId: integrationEnv.baseId!,
      tableId: integrationEnv.tableId!,
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
      apiKey: integrationEnv.apiKey!,
      baseId: integrationEnv.baseId!,
      tableId: integrationEnv.tableId!,
      records,
    });

    expect(response.records.length).toBe(records.length);
  });

  test('updateRecords with Upsert', async () => {
    const response = await updateRecordsUpsert<TestFields>({
      apiKey: integrationEnv.apiKey!,
      baseId: integrationEnv.baseId!,
      tableId: integrationEnv.tableId!,
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

    expect(response.records.length).toBeGreaterThan(0);
  });
});
