import { describe, expect, test } from 'vitest';
import {
  createRecord,
  createRecords,
  deleteRecords,
  getRecords,
  replaceRecord,
  replaceRecords,
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
  test('replaceRecord', async () => {
    const created = await createRecord<TestFields>({
      apiKey: integrationEnv.apiKey!,
      baseId: integrationEnv.baseId!,
      tableId: integrationEnv.tableId!,
      fields: {
        Name: `Replace me ${Math.random()}`,
        Notes: 'before replace',
      },
    });

    const replaced = await replaceRecord<TestFields>({
      apiKey: integrationEnv.apiKey!,
      baseId: integrationEnv.baseId!,
      tableId: integrationEnv.tableId!,
      recordId: created.id,
      fields: {
        Name: `Replaced ${Math.random()}`,
      },
    });

    expect(replaced.id).toBe(created.id);
    expect(replaced.fields.Name).toBeDefined();

    await deleteRecords({
      apiKey: integrationEnv.apiKey!,
      baseId: integrationEnv.baseId!,
      tableId: integrationEnv.tableId!,
      recordIds: [created.id],
    });
  });

  test('replaceRecords', async () => {
    const created = await createRecords<TestFields>({
      apiKey: integrationEnv.apiKey!,
      baseId: integrationEnv.baseId!,
      tableId: integrationEnv.tableId!,
      records: [
        { fields: { Name: `Replace batch A ${Math.random()}` } },
        { fields: { Name: `Replace batch B ${Math.random()}` } },
      ],
    });

    const replaced = await replaceRecords<TestFields>({
      apiKey: integrationEnv.apiKey!,
      baseId: integrationEnv.baseId!,
      tableId: integrationEnv.tableId!,
      records: created.records.map((record, index) => ({
        id: record.id,
        fields: {
          Name: `Replaced batch ${index + 1} ${Math.random()}`,
        },
      })),
    });

    expect(replaced.records.length).toBe(created.records.length);

    await deleteRecords({
      apiKey: integrationEnv.apiKey!,
      baseId: integrationEnv.baseId!,
      tableId: integrationEnv.tableId!,
      recordIds: created.records.map((record) => record.id),
    });
  });

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
