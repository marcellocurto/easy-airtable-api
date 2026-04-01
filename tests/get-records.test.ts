import { describe, expect, test } from 'vitest';
import { getRecords } from '../src/index.js';
import { hasIntegrationEnv, integrationEnv } from './integration-helpers.js';

type TestFields = {
  Name?: string;
  Notes?: string;
  Status?: string;
  recordId?: string;
};

describe.skipIf(!hasIntegrationEnv)('getRecords integration', () => {
  test('returns at least one record', async () => {
    const records = await getRecords<TestFields>({
      apiKey: integrationEnv.apiKey!,
      baseId: integrationEnv.baseId!,
      tableId: integrationEnv.tableId!,
      options: {
        maxRecords: 50000,
      },
    });

    expect(records.length).toBeGreaterThan(0);
  });
});
