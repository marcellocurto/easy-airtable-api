import { describe, expect, test } from 'vitest';
import { createRecord, createRecords } from '../src/index.js';
import { hasIntegrationEnv, integrationEnv } from './integration-helpers.js';

type TestFields = {
  Name?: string;
  Notes?: string;
  Status?: string;
  recordId?: string;
};

describe.skipIf(!hasIntegrationEnv)('create record integration', () => {
  test('createRecord', async () => {
    const response = await createRecord<TestFields>({
      apiKey: integrationEnv.apiKey!,
      baseId: integrationEnv.baseId!,
      tableId: integrationEnv.tableId!,
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
      apiKey: integrationEnv.apiKey!,
      baseId: integrationEnv.baseId!,
      tableId: integrationEnv.tableId!,
      records,
      options: {
        requestInterval: 10,
        typecast: true,
      },
    });

    expect(response.records.length).toBe(records.length);
  });
});
