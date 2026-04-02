import { describe, expect, test } from 'vitest';
import {
  createRecord,
  createRecords,
  deleteRecord,
  deleteRecords,
} from '../src/index.js';
import { hasIntegrationEnv, integrationEnv } from './integration-helpers.js';

describe.skipIf(!hasIntegrationEnv)('delete record integration', () => {
  test('deletes a single record through the public API', async () => {
    const created = await createRecord<{ Name?: string }>({
      apiKey: integrationEnv.apiKey!,
      baseId: integrationEnv.baseId!,
      tableId: integrationEnv.tableId!,
      fields: {
        Name: `Delete me ${Math.random()}`,
      },
    });

    const response = await deleteRecord({
      apiKey: integrationEnv.apiKey!,
      baseId: integrationEnv.baseId!,
      tableId: integrationEnv.tableId!,
      recordId: created.id,
    });

    expect(response).toEqual({
      id: created.id,
      deleted: true,
    });
  });

  test('deletes multiple records through the public API', async () => {
    const created = await createRecords<{ Name?: string }>({
      apiKey: integrationEnv.apiKey!,
      baseId: integrationEnv.baseId!,
      tableId: integrationEnv.tableId!,
      records: [
        { fields: { Name: `Delete me A ${Math.random()}` } },
        { fields: { Name: `Delete me B ${Math.random()}` } },
      ],
    });

    const response = await deleteRecords({
      apiKey: integrationEnv.apiKey!,
      baseId: integrationEnv.baseId!,
      tableId: integrationEnv.tableId!,
      recordIds: created.records.map((record) => record.id),
    });

    expect(response.records.length).toBe(2);
    expect(response.records.every((record) => record.deleted)).toBe(true);
  });
});
